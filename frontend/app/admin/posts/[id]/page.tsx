"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MarkdownPreview } from "@/components/posts/MarkdownPreview";
import { getAdminPost } from "@/lib/admin/api.posts";
import { formatDate } from "@/lib/format";
import { ApiError } from "@/lib/http";
import type { Post } from "@/types";

export default function AdminPostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [post, setPost] = useState<Post | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getAdminPost(id)
      .then(setPost)
      .catch((e: unknown) => {
        setLoadError(e instanceof ApiError ? e.message : "読み込みに失敗しました");
      });
  }, [id]);

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
  }

  if (!post) {
    return <p className="text-zinc-500">読み込み中...</p>;
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-700">
        ← 一覧に戻る
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              post.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {post.status === "published" ? "公開" : "下書き"}
          </span>
          <h1 className="mt-2 text-xl font-bold text-zinc-900">{post.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {post.slug} ・ {formatDate(post.created_at)}
          </p>
        </div>
        <Link
          href={`/admin/posts/${post.id}/edit`}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white"
        >
          編集
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
          >
            {tag.name}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <MarkdownPreview>{post.body}</MarkdownPreview>
      </div>
    </div>
  );
}
