// src/lib/apiClient.js
export const API_BASE = process.env.REACT_APP_API_BASE || "https://artitracktesting.onrender.com";

function buildUrl(path) {
  if (typeof path !== "string") {
    throw new TypeError(`api(): first argument must be a string URL path. Got ${typeof path}`);
  }
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE.replace(/\/+$/, "");
  const rel  = path.replace(/^\/+/, "");
  return `${base}/${rel}`;
}

export function absolutize(url) {
  if (!url) return "";
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  const cleaned = String(url).replace(/^\/+/, "");
  const base    = API_BASE.replace(/\/+$/, "");
  return `${base}/${cleaned}`;
}

function getXsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * api(path, { method='GET', body, headers, signal, credentials='include' })
 * Cookie-based session (Sanctum). Sends XSRF token automatically for unsafe verbs.
 */
export async function api(
  path,
  { method = "GET", body, headers = {}, signal, credentials = "include" } = {}
) {
  const url = buildUrl(path);

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const isPlainObject = body && typeof body === "object" && !isForm && !(body instanceof Blob);
  const payload = isPlainObject ? JSON.stringify(body) : body;

  const baseHeaders = {Accept: "application/json"};
  if (isPlainObject) baseHeaders["Content-Type"] = "application/json";

  // Attach XSRF token for unsafe methods
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  if (unsafe) baseHeaders["X-XSRF-TOKEN"] = getXsrfToken();

  const res = await fetch(url, {
    method,
    body: payload,
    headers: { ...baseHeaders, ...headers },
    credentials: "include",
    signal,
  });

  if (res.status === 204) return null;

  const ct = res.headers.get("Content-Type") || "";
  const data = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    // Quiet the normal guest probe on the login page:
    // treat 401 from /api/auth/me as "not logged in" instead of throwing.
    const isMeEndpoint =
      typeof url === "string"
        ? url.includes("/api/auth/me")
        : false;
    if (res.status === 401 && isMeEndpoint) {
      // Suppress console error for expected 401 on /api/auth/me
      return null; // <= means "guest"
    }
    const message = (data && data.message) || (typeof data === "string" ? data : `HTTP ${res.status}`);
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    
    // Only log non-401 errors to avoid cluttering console with expected auth failures
    if (res.status !== 401) {
      console.error(`API Error ${res.status}:`, message);
    }
    
    throw err;
  }

  return data;
}

let csrfPromise = null;
export async function primeCsrf() {
  if (!csrfPromise) {
    csrfPromise = fetch(buildUrl("/sanctum/csrf-cookie"), { credentials: "include" })
      .finally(() => { csrfPromise = null; });
  }
  return csrfPromise;
}

export async function apiProbe(path, opts = {}) {
  try {
    const data = await api(path, opts);
    return { status: 200, data };
  } catch (err) {
    if (err && err.status === 401) {
      // Suppress 401 errors for auth probes - this is expected for guest users
      return { status: 401, data: null };
    }
    // Only log unexpected errors
    if (err && err.status !== 401) {
      console.error('API Error:', err);
    }
    throw err;
  }
}
