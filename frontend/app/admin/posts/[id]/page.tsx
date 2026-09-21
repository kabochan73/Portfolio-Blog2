"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { MarkdownPreview } from "@/components/posts/MarkdownPreview";
import { Button } from "@/components/ui/Button";
import { TagBadge } from "@/components/ui/TagBadge";
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
        <Button href={`/admin/posts/${post.id}/edit`} className="mt-3 shrink-0">
          編集
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <time dateTime={post.created_at} className="text-xl text-zinc-800">
          {formatDate(post.created_at)}
        </time>
        {post.tags.map((tag) => (
          <TagBadge key={tag.id}>{tag.name}</TagBadge>
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
