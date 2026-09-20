import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { Post } from "@/types";

export function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return <p className="text-zinc-500">記事がまだありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/posts/${post.slug}`}
            className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400"
          >
            <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              {post.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <h2 className="truncate text-lg font-semibold text-zinc-900">{post.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
