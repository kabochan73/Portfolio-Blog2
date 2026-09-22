/**
 * @jest-environment jsdom
 */

function clearCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  });
}

describe("lib/http", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.resetModules();
    // lib/http.ts reads this at module-load time; pin it so the test is
    // deterministic regardless of what the surrounding environment (e.g. a
    // docker-compose container) happens to set it to.
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000/api";
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    clearCookies();
  });

  it("stores status, message, and validation errors on ApiError", async () => {
    const { ApiError } = await import("@/lib/http");
    const err = new ApiError(422, "Validation failed", { email: ["required"] });

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(422);
    expect(err.message).toBe("Validation failed");
    expect(err.errors).toEqual({ email: ["required"] });
  });

  it("fetches the csrf cookie endpoint only once across repeated calls", async () => {
    fetchMock.mockResolvedValue({ ok: true } as Response);
    const { ensureCsrfCookie } = await import("@/lib/http");

    await ensureCsrfCookie();
    await ensureCsrfCookie();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/sanctum/csrf-cookie", {
      credentials: "include",
    });
  });

  it("does not fetch a csrf cookie for a GET request", async () => {
    fetchMock.mockResolvedValue({ ok: true } as Response);
    const { authFetch } = await import("@/lib/http");

    await authFetch("/posts");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit & { headers: Headers }];
    expect(url).toBe("http://localhost:8000/api/posts");
    expect(init.credentials).toBe("include");
    expect(init.headers.get("Accept")).toBe("application/json");
  });

  it("fetches the csrf cookie before a POST and attaches the XSRF token header", async () => {
    document.cookie = "XSRF-TOKEN=abc123";
    fetchMock.mockResolvedValue({ ok: true } as Response);
    const { authFetch } = await import("@/lib/http");

    await authFetch("/login", { method: "POST", body: JSON.stringify({ email: "a@b.com" }) });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/sanctum/csrf-cookie");

    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit & { headers: Headers }];
    expect(url).toBe("http://localhost:8000/api/login");
    expect(init.headers.get("X-XSRF-TOKEN")).toBe("abc123");
    expect(init.headers.get("Content-Type")).toBe("application/json");
  });

  it("throws an ApiError on a non-ok response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: "Validation failed", errors: { email: ["required"] } }),
    } as unknown as Response);
    const { authFetchJson, ApiError } = await import("@/lib/http");

    await expect(authFetchJson("/login", { method: "POST" })).rejects.toBeInstanceOf(ApiError);
  });

  it("falls back to a generic message when the error body isn't JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);
    const { authFetchJson } = await import("@/lib/http");

    await expect(authFetchJson("/posts")).rejects.toMatchObject({
      status: 500,
      message: "リクエストに失敗しました",
    });
  });

  it("returns undefined for a 204 No Content response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error("should not be called");
      },
    } as unknown as Response);
    const { authFetchJson } = await import("@/lib/http");

    await expect(authFetchJson("/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("returns the parsed JSON body on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 1 } }),
    } as unknown as Response);
    const { authFetchJson } = await import("@/lib/http");

    await expect(authFetchJson("/posts")).resolves.toEqual({ data: { id: 1 } });
  });
});
