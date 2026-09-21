"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { logout, useAuthState } from "@/lib/admin/auth";

/**
 * Renders inside the site's root header (not admin/layout.tsx) so the admin
 * nav + logout button show up on every page, but only once authenticated.
 */
export function AdminHeader() {
  const auth = useAuthState();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (auth.status !== "authenticated") {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-xl font-bold">
      <nav className="flex gap-4 text-zinc-900">
        <Link href="/admin" className="hover:text-zinc-400">
          Articles
        </Link>
        <Link href="/admin/tags" className="hover:text-zinc-400">
          Tag
        </Link>
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="text-zinc-700 hover:text-zinc-400"
      >
        Logout
      </button>
    </div>
  );
}