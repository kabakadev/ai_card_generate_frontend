// src/api.js

// --- Base URLs ---
const LOCAL_API = "http://127.0.0.1:5000";
const PROD_API = "https://ai-card-generate-backend.onrender.com";

// --- Config ---
const DEFAULT_TIMEOUT_MS = 5000; // can be overridden per request via options.timeoutMs
const STORAGE_BASE_KEY = "apiBase"; // session-only: resets when tab closes

// Optional debug logs (Vite: VITE_API_DEBUG=true)
const DEBUG =
  typeof import.meta !== "undefined" &&
  import.meta.env?.VITE_API_DEBUG === "true";
const log = (...a) => {
  if (DEBUG) console.log("[api]", ...a);
};
const warn = (...a) => {
  if (DEBUG) console.warn("[api]", ...a);
};

// --- Utils ---
const join = (base, endpoint) =>
  `${base.replace(/\/+$/, "")}/${String(endpoint).replace(/^\/+/, "")}`;

function withTimeout(promise, ms) {
  const timeout = typeof ms === "number" ? ms : DEFAULT_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const id = setTimeout(
      () => reject(new Error(`Timeout after ${timeout}ms`)),
      timeout
    );
    promise
      .then((r) => {
        clearTimeout(id);
        resolve(r);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

// Heuristic: “network error” if there’s no response object
function isNetworkOrTimeout(err) {
  const msg = String(err?.message || "").toLowerCase();
  return (
    !("ok" in (err || {})) &&
    (msg.includes("failed") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("fetch") ||
      msg.includes("connection"))
  );
}

// --- Session-persisted base selection (per tab) ---
let CHOSEN_BASE = null;
const ss = typeof window !== "undefined" ? window.sessionStorage : null;
if (ss && ss.getItem(STORAGE_BASE_KEY))
  CHOSEN_BASE = ss.getItem(STORAGE_BASE_KEY);

function setBase(base) {
  CHOSEN_BASE = base;
  if (ss) ss.setItem(STORAGE_BASE_KEY, base);
  log(`Base selected: ${base.toUpperCase()}`);
}
export function getBase() {
  return CHOSEN_BASE || "local";
}
export function resetBase() {
  CHOSEN_BASE = null;
  if (ss) ss.removeItem(STORAGE_BASE_KEY);
  log("Base reset (will reselect on next request)");
}
export function forceBase(base /* "local" | "prod" */) {
  setBase(base);
}
export function currentBaseUrl() {
  return getBase() === "prod" ? PROD_API : LOCAL_API;
}
export function connectedLabel() {
  return getBase().toUpperCase();
}

// --- Per-base token storage ---
const TOKEN_KEY_LOCAL = "authToken_local";
const TOKEN_KEY_PROD = "authToken_prod";
const keyFor = (base) => (base === "prod" ? TOKEN_KEY_PROD : TOKEN_KEY_LOCAL);

export function getToken(base = getBase()) {
  try {
    return localStorage.getItem(keyFor(base));
  } catch {
    return null;
  }
}
export function setToken(token, base = getBase()) {
  try {
    if (token) localStorage.setItem(keyFor(base), token);
    else localStorage.removeItem(keyFor(base));
  } catch {}
}
export function clearAllTokens() {
  try {
    localStorage.removeItem(TOKEN_KEY_LOCAL);
    localStorage.removeItem(TOKEN_KEY_PROD);
  } catch {}
}
export function authHeader(base = getBase()) {
  const t = getToken(base);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// --- Core fetch with smart fallback ---
// Rules:
//  • Sticky base per tab, BUT if the chosen base throws a NETWORK/TIMEOUT, try the other base.
//  • Do NOT flip on HTTP errors (4xx/5xx).
//  • { preferLocal: true } tries local first for THIS call, falling back on network/timeout.
//  • { timeoutMs } applies per call.
export async function fetchWithFallback(endpoint, options = {}) {
  const { preferLocal, timeoutMs } = options;

  const tryLocal = async () => {
    log(
      "Trying LOCAL →",
      endpoint,
      timeoutMs ? `(timeout ${timeoutMs}ms)` : ""
    );
    const res = await withTimeout(
      fetch(join(LOCAL_API, endpoint), options),
      timeoutMs
    );
    setBase("local");
    return res;
  };
  const tryProd = async () => {
    log(
      "Trying PROD  →",
      endpoint,
      timeoutMs ? `(timeout ${timeoutMs}ms)` : ""
    );
    const res = await withTimeout(
      fetch(join(PROD_API, endpoint), options),
      timeoutMs
    );
    setBase("prod");
    return res;
  };

  // 1) Per-call override: local-first, fallback on network/timeout
  if (preferLocal) {
    try {
      return await tryLocal();
    } catch (err) {
      if (isNetworkOrTimeout(err)) {
        warn("Prefer-local failed; falling back to PROD:", err?.message || err);
        return await tryProd();
      }
      throw err; // HTTP error—bubble up
    }
  }

  // 2) Sticky: if we already chose, try that base, and only fallback on NETWORK/TIMEOUT
  if (CHOSEN_BASE === "local") {
    try {
      return await tryLocal();
    } catch (err) {
      if (isNetworkOrTimeout(err)) {
        warn("LOCAL unreachable; trying PROD once:", err?.message || err);
        return await tryProd();
      }
      throw err;
    }
  }
  if (CHOSEN_BASE === "prod") {
    try {
      return await tryProd();
    } catch (err) {
      if (isNetworkOrTimeout(err)) {
        warn("PROD unreachable; trying LOCAL once:", err?.message || err);
        return await tryLocal();
      }
      throw err;
    }
  }

  // 3) First contact: local-first, fallback only on network/timeout
  try {
    return await tryLocal();
  } catch (err) {
    if (isNetworkOrTimeout(err)) {
      warn("Local unreachable, using PROD:", err?.message || err);
      return await tryProd();
    }
    throw err;
  }
}

// --- JSON helpers ---
async function handleJson(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) || `Request failed: ${res.status}`;
    if (DEBUG) warn(`HTTP ${res.status} for ${res.url}`, data);
    const e = new Error(msg);
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
}

async function requestJSON(method, endpoint, body, options = {}) {
  const { preferLocal, noAuth, timeoutMs } = options;
  const base = getBase();

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
    ...(noAuth ? {} : authHeader(base)),
    ...(method !== "GET" && method !== "HEAD"
      ? { "Content-Type": "application/json" }
      : {}),
  };

  const res = await fetchWithFallback(endpoint, {
    ...options,
    preferLocal,
    timeoutMs,
    method,
    headers,
    body:
      method !== "GET" && method !== "HEAD"
        ? JSON.stringify(body ?? {})
        : undefined,
  });

  return handleJson(res);
}

// --- Public helpers ---
export const getJSON = (endpoint, options = {}) =>
  requestJSON("GET", endpoint, null, options);
export const postJSON = (endpoint, body, options = {}) =>
  requestJSON("POST", endpoint, body, options);
export const putJSON = (endpoint, body, options = {}) =>
  requestJSON("PUT", endpoint, body, options);
export const patchJSON = (endpoint, body, options = {}) =>
  requestJSON("PATCH", endpoint, body, options);
export const deleteJSON = (endpoint, options = {}) =>
  requestJSON("DELETE", endpoint, null, options);

// --- Health (optional) ---
export async function ping() {
  try {
    const res = await fetchWithFallback("/health", { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
