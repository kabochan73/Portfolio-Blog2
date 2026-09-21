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
    <div className="mx-auto w-full max-w-4xl p-4 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="mt-3 text-4xl font-bold text-zinc-900">{post.title}</h1>
        <Link
          href={`/admin/posts/${post.id}/edit`}
          className="mt-3 shrink-0 rounded-lg border-2 border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#18181b] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none"
        >
          編集
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <time dateTime={post.created_at} className="text-xl text-zinc-800">
          {formatDate(post.created_at)}
        </time>
        {post.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white"
          >
            {tag.name}
          </span>
        ))}
      </div>

      {post.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnail_url}
          alt=""
          className="mt-6 w-full rounded-xl object-cover"
        />
      ) : null}

      <div className="mt-8">
        <MarkdownPreview>{post.body}</MarkdownPreview>
      </div>

      <Link href="/admin" className="flex justify-end text-xl text-zinc-800 hover:text-zinc-600">
        ← Back
      </Link>
    </div>
  );
}
