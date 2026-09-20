import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/posts/MarkdownContent";
import { Sidebar } from "@/components/tags/Sidebar";
import { formatDate } from "@/lib/format";
import { getPost, getPosts, getTags } from "@/lib/public/api";
import type { Post } from "@/types";

function getRelatedPosts(current: Post, allPosts: Post[], limit = 3): Post[] {
  const currentTagIds = new Set(current.tags.map((tag) => tag.id));

  return allPosts
    .filter((post) => post.id !== current.id)
    .map((post) => ({
      post,
      overlap: post.tags.filter((tag) => currentTagIds.has(tag.id)).length,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map(({ post }) => post);
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, allPosts, tags] = await Promise.all([getPost(slug), getPosts(), getTags()]);

  if (!post) {
    notFound();
  }

  const related = getRelatedPosts(post, allPosts);

  const counts: Record<number, number> = {};
  for (const p of allPosts) {
    for (const tag of p.tags) {
      counts[tag.id] = (counts[tag.id] ?? 0) + 1;
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="min-w-0 flex-1">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← 一覧に戻る
        </Link>

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

        <h1 className="mt-3 text-2xl font-bold text-zinc-900">{post.title}</h1>
        <time dateTime={post.created_at} className="mt-2 block text-sm text-zinc-500">
          {formatDate(post.created_at)}
        </time>

        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt=""
            className="mt-6 w-full rounded-xl object-cover"
          />
        ) : null}

        <div className="mt-8">
          <MarkdownContent>{post.body}</MarkdownContent>
        </div>
      </div>

      <Sidebar tags={tags} counts={counts} related={related} />
    </div>
  );
}
