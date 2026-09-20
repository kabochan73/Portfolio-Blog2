"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PostForm } from "@/components/admin/PostForm";
import { createPost } from "@/lib/admin/api.posts";
import { listAdminTags } from "@/lib/admin/api.tags";
import type { Tag } from "@/types";

export default function NewPostPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    listAdminTags()
      .then(setTags)
      .catch(() => {
        // Tag list is a nice-to-have here; the form still works without it.
      });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900">新規作成</h1>
      <div className="mt-6">
        <PostForm
          tags={tags}
          submitLabel="作成"
          onSubmit={async (input) => {
            await createPost(input);
            router.push("/admin");
          }}
        />
      </div>
    </div>
  );
}
