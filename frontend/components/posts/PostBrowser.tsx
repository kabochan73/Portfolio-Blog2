"use client";

import { useState } from "react";

import { PostList } from "@/components/posts/PostList";
import { Sidebar } from "@/components/tags/Sidebar";
import type { Post, Tag } from "@/types";

export const ALL_POSTS_KEY = "all";

type PostBrowserProps = {
  posts: Post[];
  tags: Tag[];
  counts: Record<number, number>;
};

export function PostBrowser({ posts, tags, counts }: PostBrowserProps) {
  const [selectedKey, setSelectedKey] = useState<string>(ALL_POSTS_KEY);

  function handleSelect(key: string) {
    setSelectedKey((current) => (current === key ? ALL_POSTS_KEY : key));
  }

  const visiblePosts =
    selectedKey === ALL_POSTS_KEY
      ? posts
      : posts.filter((post) => post.tags.some((tag) => String(tag.id) === selectedKey));

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex-1">
        <PostList posts={visiblePosts} />
      </div>
      <Sidebar
        tags={tags}
        counts={counts}
        selectedKey={selectedKey}
        onSelect={handleSelect}
      />
    </div>
  );
}
