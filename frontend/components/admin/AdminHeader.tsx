"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/admin/auth";

export function AdminHeader() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
      <nav className="flex gap-4 text-sm text-zinc-600">
        <Link href="/admin" className="hover:text-zinc-900">
          投稿一覧
        </Link>
        <Link href="/admin/tags" className="hover:text-zinc-900">
          タグ管理
        </Link>
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ログアウト
      </button>
    </header>
  );
}
