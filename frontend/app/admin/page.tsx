"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminPostList } from "@/components/admin/AdminPostList";
import { deletePost, listPosts } from "@/lib/admin/api.posts";
import { ApiError } from "@/lib/http";
import type { Post, PostStatus } from "@/types";

type StatusFilter = "all" | PostStatus;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全て" },
  { key: "published", label: "公開" },
  { key: "draft", label: "下書き" },
];

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    listPosts()
      .then(setPosts)
      .catch((e: unknown) => {
        setLoadError(e instanceof ApiError ? e.message : "読み込みに失敗しました");
      });
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("この記事を削除しますか？")) {
      return;
    }

    setDeleteError(null);
    try {
      await deletePost(id);
      setPosts((prev) => prev?.filter((post) => post.id !== id) ?? null);
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "削除に失敗しました");
    }
  }

  const filteredPosts =
    posts?.filter((post) => statusFilter === "all" || post.status === statusFilter) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">投稿一覧</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white"
        >
          新規作成
        </Link>
      </div>

      <div className="mt-4 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-full px-3 py-1 text-sm ${
              statusFilter === tab.key ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadError ? <p className="mt-4 text-sm text-red-600">{loadError}</p> : null}
      {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}

      <div className="mt-4">
        {posts === null && !loadError ? (
          <p className="text-zinc-500">読み込み中...</p>
        ) : (
          <AdminPostList posts={filteredPosts} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
