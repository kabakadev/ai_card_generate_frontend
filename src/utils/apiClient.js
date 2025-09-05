// src/utils/apiClient.js
import axios from "axios";

// IMPORTANT: keep base selection in sync with fetch api.js logic if you mix both.
// For simplicity, we keep a light independent sticky base here.

const LOCAL_API = "http://127.0.0.1:5000";
const PROD_API = "https://ai-card-generate-backend.onrender.com";

let chosenBase = null; // "local" | "prod" | null

function getBaseUrl() {
  if (chosenBase === "local") return LOCAL_API;
  if (chosenBase === "prod") return PROD_API;
  // default to LOCAL first
  return LOCAL_API;
}
function setBaseFromUrl(url) {
  chosenBase = url.startsWith(PROD_API) ? "prod" : "local";
}

function getToken() {
  try {
    const key = chosenBase === "prod" ? "authToken_prod" : "authToken_local";
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const instance = axios.create({
  timeout: 5000, // default; override per call
  headers: { "Content-Type": "application/json" },
});

// Attach JWT if present
instance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Only fallback to prod on network/timeout errors, not on HTTP status errors
async function requestWithFallback(method, path, data, opts = {}) {
  const { timeoutMs, preferLocal } = opts;

  const attempt = async (baseUrl) => {
    const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
    return instance.request({
      url,
      method,
      data,
      timeout:
        typeof timeoutMs === "number" ? timeoutMs : instance.defaults.timeout,
      headers: opts.headers || {},
    });
  };

  const tryLocal = async () => {
    const res = await attempt(LOCAL_API);
    setBaseFromUrl(LOCAL_API);
    return res;
  };
  const tryProd = async () => {
    const res = await attempt(PROD_API);
    setBaseFromUrl(PROD_API);
    return res;
  };

  try {
    if (preferLocal || chosenBase === "local" || chosenBase === null) {
      return await tryLocal();
    }
    return await tryProd();
  } catch (err) {
    const isNetworkOrTimeout =
      err.code === "ECONNABORTED" ||
      err.message?.toLowerCase().includes("timeout") ||
      !err.response;

    if (isNetworkOrTimeout) {
      // fallback to the other base
      try {
        if (preferLocal || chosenBase === "local" || chosenBase === null) {
          return await tryProd();
        } else {
          return await tryLocal();
        }
      } catch (err2) {
        throw err2;
      }
    }

    // If we got an HTTP response (4xx/5xx), do NOT fallback; bubble it up
    throw err;
  }
}

const apiClient = {
  get: (path, opts) => requestWithFallback("GET", path, undefined, opts),
  post: (path, data, opts) => requestWithFallback("POST", path, data, opts),
  put: (path, data, opts) => requestWithFallback("PUT", path, data, opts),
  del: (path, opts) => requestWithFallback("DELETE", path, undefined, opts),
};

export default apiClient;
