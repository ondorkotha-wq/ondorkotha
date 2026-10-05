import { isAuthenticated } from "./auth";

const STORAGE_KEY = "visitorId";
const API = process.env.NEXT_PUBLIC_API_URL;

// The visitorId is the only thing tying a guest to their cart and orders, so
// it must be unguessable: a random v4 UUID. Older builds stored
// `${Date.now()}_${0-999}`, which get upgraded on first use.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID_RE.test(id);

// crypto.randomUUID() exists only in secure contexts (https / localhost);
// fall back to getRandomValues so e.g. testing over a LAN IP still works.
const newUuid = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

// localStorage can throw (some private modes, blocked storage); keep the id
// in memory for this page session instead of failing.
let memoryId: string | null = null;
const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryId;
  }
};
const store = (id: string) => {
  memoryId = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* memory fallback only */
  }
};

// isAuthenticated() reads localStorage unguarded, which throws when storage
// is blocked; treat that as signed out rather than failing the caller.
const signedIn = (): boolean => {
  try {
    return isAuthenticated();
  } catch {
    return false;
  }
};

const post = (path: string, method: "POST" | "PATCH", body: unknown) =>
  fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// Creates the visitor row (an upsert, so repeating it is harmless). Awaited
// on purpose: the backend's add-to-cart does find-then-create on the same
// row, so an init still in flight could make the first add-to-cart fail on a
// duplicate id. A failure here is ignored — add-to-cart creates it anyway.
const initVisitor = async (id: string) => {
  try {
    await post("/guest/init", "POST", { visitorId: id });
  } catch {
    /* ignored, see above */
  }
};

// Moves the legacy id's cart onto a fresh UUID. 409 means the UUID visitor
// already exists — i.e. an earlier attempt went through but its response was
// lost — so it counts as done. After one retry the guest switches to the UUID
// anyway: an old-format id can't place orders (the order routes require a
// UUID), so staying on it would only break checkout later.
const upgradeLegacyId = async (legacyId: string): Promise<string> => {
  const to = newUuid();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await post("/guest/migrate", "PATCH", { from: legacyId, to });
      if (res.ok || res.status === 409) {
        store(to);
        return to;
      }
    } catch {
      /* network error: retry */
    }
  }
  store(to);
  await initVisitor(to);
  return to;
};

const resolveVisitorId = async (): Promise<string | null> => {
  const stored = readStored();
  if (stored) return isUuid(stored) ? stored : upgradeLegacyId(stored);

  // Logged-in users are identified by their token and don't need one.
  if (signedIn()) return null;

  const id = newUuid();
  store(id);
  await initVisitor(id);
  return id;
};

// Cart, cart count and recently-viewed all ask on first load; sharing one
// in-flight promise stops them from creating different ids or upgrading the
// same legacy id twice.
let inFlight: Promise<string | null> | null = null;

export const getVisitorId = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const stored = readStored();
  if (stored && isUuid(stored)) return stored;

  if (!inFlight) {
    inFlight = resolveVisitorId().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

// Query params that identify the cart owner on the shared /cart/* routes.
// Logged-in requests are identified by their token; guests must send their
// visitorId, or the backend rejects the request.
export const cartOwnerParams = async (): Promise<{ visitorId?: string }> => {
  if (signedIn()) return {};
  const visitorId = await getVisitorId();
  return visitorId ? { visitorId } : {};
};
