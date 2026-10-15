// Optional cross-device sync of the SYNTHETIC demo workspace through a
// user-provided JSON relay (e.g. a tiny Cloudflare Worker backed by KV, or any
// URL that speaks GET/PUT on { slotId: { revision, payload } }).
//
// SECURITY BOUNDARY: this module is for demo data only. It never touches real
// patient information, carries no credentials in source, and does not bypass
// the Supabase/D1 authorization used by /staff. The relay endpoint and token
// are entered locally on each device and stored in localStorage on that device.
import { validateWorkspace, type Workspace } from './domain';

export interface SyncSettings {
  endpoint: string; // e.g. https://my-relay.<user>.workers.dev/aasha-demo
  token: string; // optional shared secret sent as X-Sync-Key
  enabled: boolean;
}

const SETTINGS_KEY = 'aasha-sync-settings-v1';
const SLOT_PREFIX = 'aasha-sync-slot-';
const AUTO_INTERVAL_MS = 5 * 60 * 1000;

export function loadSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { endpoint: '', token: '', enabled: false, ...JSON.parse(raw) };
  } catch {}
  return { endpoint: '', token: '', enabled: false };
}

export function saveSettings(settings: SyncSettings): void {
  if (settings.endpoint && !/^https:\/\//i.test(settings.endpoint)) {
    throw new Error('The sync relay endpoint must be an https:// URL.');
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

// Stable per-centre slot id so two devices sync the same centre.
export function slotId(workspace: Workspace): string {
  let stored = localStorage.getItem(SLOT_PREFIX + workspace.id);
  if (!stored) {
    stored = crypto.randomUUID();
    localStorage.setItem(SLOT_PREFIX + workspace.id, stored);
  }
  return stored;
}

export interface RemoteRecord {
  revision: number;
  updatedAt: string;
  payload: Workspace;
}

/** The relay stores one record per slot under a random secret path segment. */
export function relayUrl(endpoint: string, slot: string): string {
  const clean = endpoint.replace(/\/+$/, '');
  return `${clean}/${encodeURIComponent(slot)}`;
}

/**
 * Shape check only — the relay payload is untrusted input. The full Zod
 * workspace validation in pullWorkspace is what actually guards the app.
 */
export function looksLikeRemoteRecord(value: unknown): value is RemoteRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.revision === 'number' &&
    Number.isInteger(record.revision) &&
    record.revision >= 0 &&
    typeof record.updatedAt === 'string' &&
    typeof record.payload === 'object' &&
    record.payload !== null
  );
}

export type SyncResult =
  | { kind: 'off' }
  | { kind: 'up-to-date' }
  | { kind: 'pushed' }
  | { kind: 'pulled'; remote: Workspace }
  | { kind: 'conflict'; remote: Workspace }
  | { kind: 'unauthorized' }
  | { kind: 'error'; message: string };

/** Push local state when it is newer than the relay copy. */
export async function pushWorkspace(settings: SyncSettings, workspace: Workspace): Promise<SyncResult> {
  if (!settings.enabled || !settings.endpoint) return { kind: 'off' };
  try {
    const response = await fetch(relayUrl(settings.endpoint, slotId(workspace)), {
      method: 'PUT',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        ...(settings.token ? { 'X-Sync-Key': settings.token } : {}),
      },
      body: JSON.stringify({
        revision: workspace.revision,
        updatedAt: new Date().toISOString(),
        payload: workspace,
      }),
    });
    if (response.status === 401 || response.status === 403) return { kind: 'unauthorized' };
    if (response.status === 409) {
      // The relay holds a newer copy; surface it so the user can pull instead.
      const remote = await pullWorkspace(settings, workspace);
      if (remote) return { kind: 'pulled', remote: remote.payload };
      return { kind: 'error', message: 'The relay has a newer copy but could not read it back.' };
    }
    if (!response.ok) return { kind: 'error', message: `Relay responded ${response.status}.` };
    return { kind: 'pushed' };
  } catch (error) {
    return { kind: 'error', message: error instanceof Error && error.name === 'AbortError' ? 'Sync timed out.' : 'The sync relay is unreachable.' };
  }
}

/**
 * Fetch the relay copy, if any. Returns null when nothing is stored yet or the
 * relay returned something that is not a well-formed, valid demo workspace —
 * a hostile or corrupted relay can only ever cause a no-op pull.
 */
export async function pullWorkspace(settings: SyncSettings, workspace: Workspace): Promise<RemoteRecord | null> {
  if (!settings.enabled || !settings.endpoint) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(relayUrl(settings.endpoint, slotId(workspace)), {
      method: 'GET',
      signal: controller.signal,
      headers: settings.token ? { 'X-Sync-Key': settings.token } : {},
    });
  } finally {
    clearTimeout(timer);
  }
  if (response.status === 404) return null;
  if (response.status === 401 || response.status === 403) throw new Error('The relay rejected this device’s key.');
  if (!response.ok) throw new Error(`Relay responded ${response.status}.`);
  const record: unknown = await response.json().catch(() => null);
  if (!looksLikeRemoteRecord(record)) return null;
  try {
    const payload = validateWorkspace(record.payload);
    if (payload.id !== workspace.id) return null; // wrong centre — ignore
    return { ...record, payload };
  } catch {
    return null; // relay content is not a valid demo workspace
  }
}

/**
 * Last-writer-wins by revision counter. Fine for one person's synthetic demo
 * across two devices; deliberately NOT a merge strategy for clinical data.
 */
export async function syncWorkspace(settings: SyncSettings, workspace: Workspace): Promise<SyncResult> {
  if (!settings.enabled || !settings.endpoint) return { kind: 'off' };
  try {
    const remote = await pullWorkspace(settings, workspace);
    if (!remote) return await pushWorkspace(settings, workspace);
    if (workspace.revision > remote.revision) return await pushWorkspace(settings, workspace);
    if (workspace.revision < remote.revision) return { kind: 'pulled', remote: remote.payload };
    return { kind: 'up-to-date' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('key')) return { kind: 'unauthorized' };
    return { kind: 'error', message: error instanceof Error ? error.message : 'Sync failed.' };
  }
}

/** Register an auto-sync loop; returns an unsubscribe function. */
export function startAutoSync(getWorkspace: () => Workspace | undefined, onResult: (result: SyncResult) => void): () => void {
  const tick = () => {
    const workspace = getWorkspace();
    if (!workspace) return;
    const settings = loadSettings();
    if (!settings.enabled) return;
    void syncWorkspace(settings, workspace).then((result) => {
      if (result.kind !== 'off') onResult(result);
    });
  };
  const interval = setInterval(tick, AUTO_INTERVAL_MS);
  window.addEventListener('online', tick);
  return () => {
    clearInterval(interval);
    window.removeEventListener('online', tick);
  };
}