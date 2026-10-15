import { accessToken, getAuth } from "./auth";
import { useEffect, useRef, useState, type FormEvent } from "react";

type Organization = { id: string; name: string; role: string };
type Member = { email: string; role: string; active: number; revision: number };
// On GitHub Pages there is no same-origin /api. The staff portal then targets
// the separately deployed Worker origin (set via VITE_API_BASE at build time,
// or entered once in the sign-in screen and kept in this browser only).
const WORKER_KEY = "aasha-api-base-v1";
function normalizeBase(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (!/^https:\/\//i.test(trimmed))
    throw new Error("The API origin must be an https:// URL.");
  try {
    const url = new URL(trimmed);
    if (!/(^[a-z0-9-]+\.workers\.dev$|\.workers\.dev$)/i.test(url.hostname) && !url.hostname.endsWith(".com"))
      throw new Error("");
    return url.origin;
  } catch {
    throw new Error("That does not look like a valid https origin.");
  }
}
function apiOrigin(): string {
  const configured = normalizeBase(import.meta.env.VITE_API_BASE ?? "");
  if (configured) return configured;
  if (location.hostname.endsWith(".workers.dev")) return "";
  const stored = localStorage.getItem(WORKER_KEY) ?? "";
  return stored.replace(/\/+$/, "");
}
function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  return (async () => {
    const token = await accessToken();
    const headers = new Headers(options.headers);
    if (token) headers.set("Authorization", "Bearer " + token);
    const response = await fetch(apiOrigin() + path, {
      ...options,
      headers,
      cache: "no-store",
      redirect: "error",
      mode: apiOrigin() ? "cors" : "same-origin",
    });
    if (response.status === 401)
      throw new Error("Your session has ended. Sign in again to continue.");
    const body = (await response.json()) as { message?: string };
    if (!response.ok) throw new Error(body.message || "The request failed.");
    return body as T;
  })();
}

export default function StaffPortal() {
  const [identity, setIdentity] = useState<{
    email: string;
    organizations: Organization[];
  } | null>(null);
  const [selected, setSelected] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [apiBase, setApiBase] = useState(() => localStorage.getItem(WORKER_KEY) ?? "");
  const staticHost = !location.hostname.endsWith(".workers.dev");
  const generation = useRef(0);
  const organization = identity?.organizations.find((o) => o.id === selected);
  useEffect(() => {
    const controller = new AbortController();
    getAuth()
      .then(() => {
        if (!controller.signal.aborted) setReady(true);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    const hide = () => {
      setIdentity(null);
      setMembers([]);
      generation.current++;
    };
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) location.reload();
    };
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", restore);
    return () => {
      controller.abort();
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", restore);
    };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const { error: failure } = await (
        await getAuth()
      ).auth.signInWithPassword({
        email: String(values.get("email")),
        password: String(values.get("password")),
      });
      form.reset();
      if (failure)
        throw new Error(
          "Sign-in failed. Check your credentials and confirmed account, then try again.",
        );
      setIdentity(
        await api<{ email: string; organizations: Organization[] }>(
          "/api/v1/me",
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    generation.current++;
    setMembers([]);
    setIdentity(null);
    setSelected("");
    setNotice("");
    setError("");
    try {
      const { error: failure } = await (
        await getAuth()
      ).auth.signOut({ scope: "local" });
      if (failure) throw failure;
    } catch {
      setError(
        "Remote sign-out could not be confirmed. Close this tab to discard its in-memory session.",
      );
    }
  }

  async function choose(id: string) {
    const current = ++generation.current;
    setSelected(id);
    setMembers([]);
    setError("");
    setNotice("");
    if (identity?.organizations.find((o) => o.id === id)?.role !== "admin")
      return;
    setBusy(true);
    try {
      const body = await api<{ members: Member[] }>(
        `/api/v1/organizations/${encodeURIComponent(id)}/members`,
      );
      if (current === generation.current) setMembers(body.members);
    } catch (e) {
      if (current === generation.current) setError((e as Error).message);
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>, member?: Member) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const current = generation.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(
        `/api/v1/organizations/${encodeURIComponent(selected)}/members`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: member?.email ?? values.get("email"),
            role: values.get("role"),
            active: values.get("active") === "on",
            revision: member?.revision ?? -1,
            operation: crypto.randomUUID(),
          }),
        },
      );
      if (current !== generation.current) return;
      await choose(selected);
      setNotice(
        "Access saved. The next API request uses the updated permissions.",
      );
      if (!member) form.reset();
    } catch (e) {
      if (current === generation.current)
        setError(
          `${(e as Error).message} Refresh the list before trying again.`,
        );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="staff-portal">
      <header>
        <img src="/logo.png" alt="Aasha" width="72" />
        <div>
          <p className="eyebrow">STAFF ACCESS · SYNTHETIC RELEASE</p>
          <h1>Centre administration</h1>
        </div>
      </header>
      <p>
        Manage centre membership. Clinical records and clinical signing are not
        enabled in this release.
      </p>
      <nav aria-label="Staff actions">
        <a href={`${import.meta.env.BASE_URL}index.html`}>Open device-local demo</a> ·{" "}
        <a href={`${import.meta.env.BASE_URL}staff.html`}>Refresh sign-in</a> ·{" "}
        {identity && (
          <button className="text-button" onClick={() => void signOut()}>
            Sign out
          </button>
        )}
      </nav>
      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!ready && !error && <p role="status">Preparing sign-in…</p>}
      {ready && !identity && (
        <section className="panel padded">
          <h2>Staff sign-in</h2>
          <p>
            Use your confirmed staff account. This session stays in memory;
            reloading signs you out.
          </p>
          <form onSubmit={(e) => void signIn(e)}>
            {staticHost && (
              <label>
                Worker API origin (your deployed preview URL)
                <input
                  name="apibase"
                  type="url"
                  inputMode="url"
                  placeholder="https://aasha-offline-preview.<account>.workers.dev"
                  defaultValue={apiBase}
                  onChange={(e) => {
                    try {
                      const value = normalizeBase(e.target.value);
                      if (value) localStorage.setItem(WORKER_KEY, value);
                      else localStorage.removeItem(WORKER_KEY);
                      setApiBase(value);
                      setError("");
                    } catch (failure) {
                      setError((failure as Error).message);
                    }
                  }}
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="button" disabled={busy}>
              Sign in
            </button>
          </form>
          <p>
            Need an account or password recovery? Contact your organization’s
            account operator.
          </p>
        </section>
      )}
      {identity && (
        <>
          <p>Signed in as {identity.email}</p>
          {!identity.organizations.length ? (
            <p>
              No active centre memberships. Ask your centre administrator to
              grant access to your verified email address.
            </p>
          ) : (
            <label>
              Centre
              <select
                value={selected}
                disabled={busy}
                onChange={(e) => void choose(e.target.value)}
              >
                <option value="">Select a centre</option>
                {identity.organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.role}
                  </option>
                ))}
              </select>
            </label>
          )}
          {organization && (
            <section className="panel padded">
              <h2>{organization.name}</h2>
              <p>
                Your role: {organization.role}. Administrator access does not
                grant clinical authority.
              </p>
              {organization.role !== "admin" ? (
                <p>
                  Your membership is active. Team administration is restricted
                  to centre administrators. Clinical workflows are not yet
                  available.
                </p>
              ) : (
                <>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => void choose(selected)}
                  >
                    Refresh members
                  </button>
                  <h3>Grant access</h3>
                  <p>
                    Use a confirmed staff account email. This saves a
                    membership; it does not send an invitation email.
                  </p>
                  <form onSubmit={(e) => void save(e)}>
                    <label>
                      Email
                      <input
                        name="email"
                        type="email"
                        maxLength={254}
                        required
                      />
                    </label>
                    <RoleFields />
                    <button className="button" disabled={busy}>
                      Grant access
                    </button>
                  </form>
                  <h3>Members</h3>
                  <p>
                    Up to 100 membership records per centre. Your identity
                    provider’s free seat limit also applies.
                  </p>
                  {members.map((m) => (
                    <form
                      key={`${selected}-${m.email}-${m.revision}`}
                      className="staff-member"
                      onSubmit={(e) => void save(e, m)}
                    >
                      <h4>{m.email}</h4>
                      <fieldset disabled={busy || m.email === identity.email}>
                        <RoleFields member={m} />
                        <button className="button secondary">
                          Save access
                        </button>
                      </fieldset>
                      {m.email === identity.email && (
                        <p>Another administrator must change your access.</p>
                      )}
                    </form>
                  ))}
                </>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
function RoleFields({ member }: { member?: Member }) {
  return (
    <>
      <label>
        Role
        <select name="role" defaultValue={member?.role ?? "reception"}>
          <option value="admin">Centre administrator</option>
          <option value="supervisor">Supervisor</option>
          <option value="therapist">Therapist</option>
          <option value="reception">Reception</option>
        </select>
      </label>
      <label className="staff-active">
        <input
          name="active"
          type="checkbox"
          defaultChecked={member ? Boolean(member.active) : true}
        />{" "}
        Active membership
      </label>
    </>
  );
}
