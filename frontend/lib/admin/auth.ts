"use client";

import { useSyncExternalStore } from "react";

import { ApiError, authFetchJson } from "@/lib/http";
import type { User } from "@/types";

export type AuthState =
  | { status: "unknown" }
  | { status: "guest" }
  | { status: "authenticated"; user: User };

let state: AuthState = { status: "unknown" };
const listeners = new Set<() => void>();

function setState(next: AuthState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AuthState {
  return state;
}

export function useAuthState(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function setAuthenticatedUser(user: User): void {
  setState({ status: "authenticated", user });
}

export function clearAuth(): void {
  setState({ status: "guest" });
}

// A guard's session can expire between page loads; login/admin layout read
// this once to show a message, then consume it so it doesn't linger.
let sessionExpired = false;

export function markSessionExpired(): void {
  sessionExpired = true;
}

export function consumeSessionExpired(): boolean {
  const value = sessionExpired;
  sessionExpired = false;
  return value;
}

/** Confirms whether the httpOnly session cookie (if any) is still valid. */
export async function checkAuth(): Promise<void> {
  try {
    const user = await authFetchJson<User>("/user");
    setAuthenticatedUser(user);
  } catch {
    clearAuth();
  }
}

export async function login(email: string, password: string): Promise<User> {
  const { user } = await authFetchJson<{ user: User }>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthenticatedUser(user);

  return user;
}

export async function logout(): Promise<void> {
  await authFetchJson("/logout", { method: "POST" });
  clearAuth();
}

/**
 * Wraps authFetchJson for other admin/* modules: a 401 mid-session means the
 * cookie expired, so mark it and clear auth state before the error propagates.
 */
export async function adminFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await authFetchJson<T>(path, init);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      markSessionExpired();
      clearAuth();
    }
    throw e;
  }
}
