import { act, renderHook } from "@testing-library/react";

import {
  adminFetchJson,
  checkAuth,
  clearAuth,
  consumeSessionExpired,
  login,
  logout,
  markSessionExpired,
  setAuthenticatedUser,
  useAuthState,
} from "@/lib/admin/auth";
import { ApiError, authFetchJson } from "@/lib/http";

jest.mock("@/lib/http", () => {
  const actual = jest.requireActual("@/lib/http");
  return { ...actual, authFetchJson: jest.fn() };
});

const authFetchJsonMock = authFetchJson as jest.Mock;

describe("lib/admin/auth", () => {
  beforeEach(() => {
    authFetchJsonMock.mockReset();
  });

  // Runs first, before any other test in this file mutates the module-level
  // auth state — this is the only place the pristine "unknown" value holds.
  it("starts as unknown and reflects setAuthenticatedUser/clearAuth", () => {
    const { result } = renderHook(() => useAuthState());

    expect(result.current).toEqual({ status: "unknown" });

    const user = { id: 1, name: "Admin", email: "a@b.com" };
    act(() => setAuthenticatedUser(user));
    expect(result.current).toEqual({ status: "authenticated", user });

    act(() => clearAuth());
    expect(result.current).toEqual({ status: "guest" });
  });

  it("checkAuth sets an authenticated user on success", async () => {
    const user = { id: 1, name: "Admin", email: "a@b.com" };
    authFetchJsonMock.mockResolvedValue(user);

    const { result } = renderHook(() => useAuthState());

    await act(async () => {
      await checkAuth();
    });

    expect(authFetchJsonMock).toHaveBeenCalledWith("/user");
    expect(result.current).toEqual({ status: "authenticated", user });
  });

  it("checkAuth falls back to guest on failure", async () => {
    authFetchJsonMock.mockRejectedValue(new ApiError(401, "Unauthenticated"));

    const { result } = renderHook(() => useAuthState());

    await act(async () => {
      await checkAuth();
    });

    expect(result.current).toEqual({ status: "guest" });
  });

  it("login authenticates and returns the user", async () => {
    const user = { id: 2, name: "Admin", email: "b@b.com" };
    authFetchJsonMock.mockResolvedValue({ user });

    const { result } = renderHook(() => useAuthState());

    let returned;
    await act(async () => {
      returned = await login("b@b.com", "password");
    });

    expect(authFetchJsonMock).toHaveBeenCalledWith("/login", {
      method: "POST",
      body: JSON.stringify({ email: "b@b.com", password: "password" }),
    });
    expect(returned).toEqual(user);
    expect(result.current).toEqual({ status: "authenticated", user });
  });

  it("logout clears auth after the request succeeds", async () => {
    authFetchJsonMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthState());
    act(() => setAuthenticatedUser({ id: 1, name: "Admin", email: "a@b.com" }));

    await act(async () => {
      await logout();
    });

    expect(authFetchJsonMock).toHaveBeenCalledWith("/logout", { method: "POST" });
    expect(result.current).toEqual({ status: "guest" });
  });

  it("consumeSessionExpired returns and resets the flag set by markSessionExpired", () => {
    consumeSessionExpired(); // discard any flag left over from an earlier test

    expect(consumeSessionExpired()).toBe(false);

    markSessionExpired();
    expect(consumeSessionExpired()).toBe(true);
    expect(consumeSessionExpired()).toBe(false);
  });

  it("adminFetchJson marks the session expired and clears auth on a 401", async () => {
    authFetchJsonMock.mockRejectedValue(new ApiError(401, "Unauthenticated"));

    const { result } = renderHook(() => useAuthState());
    act(() => setAuthenticatedUser({ id: 1, name: "Admin", email: "a@b.com" }));

    await act(async () => {
      await expect(adminFetchJson("/admin/posts")).rejects.toBeInstanceOf(ApiError);
    });

    expect(result.current).toEqual({ status: "guest" });
    expect(consumeSessionExpired()).toBe(true);
  });

  it("adminFetchJson rethrows non-401 errors without touching auth state", async () => {
    authFetchJsonMock.mockRejectedValue(new ApiError(500, "Server error"));

    const { result } = renderHook(() => useAuthState());
    const user = { id: 1, name: "Admin", email: "a@b.com" };
    act(() => setAuthenticatedUser(user));
    consumeSessionExpired(); // discard any flag left over from an earlier test

    await act(async () => {
      await expect(adminFetchJson("/admin/posts")).rejects.toBeInstanceOf(ApiError);
    });

    expect(result.current).toEqual({ status: "authenticated", user });
    expect(consumeSessionExpired()).toBe(false);
  });
});
