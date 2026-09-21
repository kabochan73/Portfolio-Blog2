"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminPostList } from "@/components/admin/AdminPostList";
import { Sidebar } from "@/components/tags/Sidebar";
import { deletePost, listPosts } from "@/lib/admin/api.posts";
import { listAdminTags } from "@/lib/admin/api.tags";
import { ApiError } from "@/lib/http";
import type { Post, PostStatus, Tag } from "@/types";

type StatusFilter = "all" | PostStatus;

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全て" },
  { key: "published", label: "公開" },
  { key: "draft", label: "下書き" },
];

const ALL_TAGS_KEY = "all";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tagFilter, setTagFilter] = useState<string>(ALL_TAGS_KEY);

  useEffect(() => {
    Promise.all([listPosts(), listAdminTags()])
      .then(([loadedPosts, loadedTags]) => {
        setPosts(loadedPosts);
        setTags(loadedTags);
      })
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

  function handleTagSelect(key: string) {
    setTagFilter((current) => (current === key ? ALL_TAGS_KEY : key));
  }

  const counts: Record<number, number> = {};
  for (const post of posts ?? []) {
    for (const tag of post.tags) {
      counts[tag.id] = (counts[tag.id] ?? 0) + 1;
    }
  }

  const filteredPosts =
    posts?.filter((post) => {
      const matchesStatus = statusFilter === "all" || post.status === statusFilter;
      const matchesTag =
        tagFilter === ALL_TAGS_KEY || post.tags.some((tag) => String(tag.id) === tagFilter);

      return matchesStatus && matchesTag;
    }) ?? [];

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-zinc-900">投稿一覧</h1>
          <Link
            href="/admin/posts/new"
            className="rounded-lg border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#18181b] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none"
          >
            新規作成
          </Link>
        </div>

        <div className="mt-6 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
                statusFilter === tab.key
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-900"
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

      <div className="hidden w-px shrink-0 bg-zinc-200 sm:block" />

      <Sidebar tags={tags} counts={counts} selectedKey={tagFilter} onSelect={handleTagSelect} />
    </div>
  );
}
