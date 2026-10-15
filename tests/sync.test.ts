import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { looksLikeRemoteRecord, pullWorkspace, relayUrl, slotId, syncWorkspace, type SyncSettings } from '../src/sync';
import { seedWorkspace, type Workspace } from '../src/domain';

// The browser APIs sync.ts relies on are minimal in Node; provide simple ones.
beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  if (!('crypto' in globalThis) || !globalThis.crypto.randomUUID) {
    let n = 0;
    vi.stubGlobal('crypto', { randomUUID: () => `11111111-1111-4111-8111-${String(++n).padStart(12, '0')}` });
  }
});
afterEach(() => vi.unstubAllGlobals());

const workspace: Workspace = seedWorkspace('centre-test', 'Test centre', ['OT']);
const settings: SyncSettings = { endpoint: 'https://relay.test/aasha-demo', token: 'secret-key', enabled: true };

describe('relay URL scheme', () => {
  it('appends the slot as a path segment and trims trailing slashes', () => {
    expect(relayUrl('https://relay.test/aasha-demo/', workspace.id)).toBe('https://relay.test/aasha-demo/' + workspace.id);
  });
});

describe('looksLikeRemoteRecord', () => {
  it.each([null, undefined, 42, 'text', {}, { revision: 'x' }, { revision: -1 }, { revision: 1.5 }, { revision: 1, payload: 'no' }])(
    'rejects malformed record %#',
    (value) => expect(looksLikeRemoteRecord(value)).toBe(false),
  );
  it('accepts a well-formed record', () => {
    expect(looksLikeRemoteRecord({ revision: 3, updatedAt: 'now', payload: {} })).toBe(true);
  });
});

describe('pullWorkspace', () => {
  it('is a no-op when disabled', async () => {
    expect(await pullWorkspace({ ...settings, enabled: false }, workspace)).toBeNull();
  });

  it('returns null for empty slots and garbage payloads', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 404 }))
      .mockResolvedValueOnce(new Response('<html>attack</html>', { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ revision: 1, updatedAt: 'x', payload: { hacked: true } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await pullWorkspace(settings, workspace)).toBeNull(); // 404
    expect(await pullWorkspace(settings, workspace)).toBeNull(); // non-JSON
    expect(await pullWorkspace(settings, workspace)).toBeNull(); // invalid workspace shape
  });

  it('validates and returns a genuine newer copy, ignoring other centres', async () => {
    const record = { revision: 9, updatedAt: new Date().toISOString(), payload: { ...workspace, revision: 9 } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(record), { status: 200 })));
    const pulled = await pullWorkspace(settings, workspace);
    expect(pulled?.revision).toBe(9);
    expect(pulled?.payload.name).toBe('Test centre');

    const foreign = { ...record, payload: { ...record.payload, id: 'other-centre' } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(foreign), { status: 200 })));
    expect(await pullWorkspace(settings, workspace)).toBeNull();
  });

  it('surfaces a rejected key as an error result through syncWorkspace', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    const result = await syncWorkspace(settings, workspace);
    expect(result.kind).toBe('unauthorized');
  });
});

describe('syncWorkspace push path', () => {
  it('pushes when the relay is empty and sends the shared key', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'GET') return new Response('{}', { status: 404 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await syncWorkspace(settings, workspace);
    expect(result.kind).toBe('pushed');
    const putCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PUT');
    expect(putCall).toBeDefined();
    expect((putCall![1] as RequestInit).headers).toMatchObject({ 'X-Sync-Key': 'secret-key' });
    expect(String(putCall![0])).toMatch(/^https:\/\/relay\.test\/aasha-demo\/[0-9a-f-]{36}$/);
  });

  it('pulls instead of overwriting when the relay holds a newer revision', async () => {
    const remote = { ...workspace, revision: 42, name: 'Renamed elsewhere' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ revision: 42, updatedAt: 'x', payload: remote }), { status: 200 }),
    ));
    const result = await syncWorkspace(settings, workspace);
    expect(result.kind).toBe('pulled');
    if (result.kind === 'pulled') expect(result.remote.name).toBe('Renamed elsewhere');
  });
});

describe('slotId', () => {
  it('is a random UUID, stable per centre across calls and never the centre id itself', () => {
    const first = slotId(workspace);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(first).not.toBe(workspace.id); // the relay path segment must be unguessable
    expect(slotId(workspace)).toBe(first);
  });
});
