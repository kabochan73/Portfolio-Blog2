const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const APP_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfCookiePromise: Promise<void> | null = null;

/**
 * Sanctum's SPA cookie auth requires a fresh XSRF-TOKEN cookie before any
 * state-changing request. Only fetched once per page load; login/logout
 * rotate the token server-side, so authFetch always re-reads the cookie.
 */
export function ensureCsrfCookie(): Promise<void> {
  csrfCookiePromise ??= fetch(`${APP_ORIGIN}/sanctum/csrf-cookie`, {
    credentials: "include",
  }).then(() => undefined);

  return csrfCookiePromise;
}

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    await ensureCsrfCookie();
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  // FormData needs the browser to set its own multipart boundary; forcing
  // application/json here would break the request body.
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const xsrfToken = readCookie("XSRF-TOKEN");
  if (xsrfToken) {
    headers.set("X-XSRF-TOKEN", xsrfToken);
  }

  return fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function authFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(path, init);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.message ?? "リクエストに失敗しました",
      body?.errors,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
