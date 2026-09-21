"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PostForm } from "@/components/admin/PostForm";
import { getAdminPost, updatePost } from "@/lib/admin/api.posts";
import { listAdminTags } from "@/lib/admin/api.tags";
import { ApiError } from "@/lib/http";
import type { Post, Tag } from "@/types";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [post, setPost] = useState<Post | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAdminPost(id), listAdminTags()])
      .then(([loadedPost, loadedTags]) => {
        setPost(loadedPost);
        setTags(loadedTags);
      })
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
    <div className="mx-auto w-full max-w-4xl">
      <div className="mt-6">
        <PostForm
          tags={tags}
          initialPost={post}
          submitLabel="更新"
          onSubmit={async (input) => {
            await updatePost(id, input);
            router.push("/admin");
          }}
        />
      </div>
    </div>
  );
}
