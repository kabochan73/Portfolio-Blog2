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
            className="flex gap-4 rounded-xl border-2 border-zinc-400 bg-white p-4 shadow-[4px_4px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#18181b] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0_0_#18181b]"
          >
            <div className="h-28 w-42 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
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
                <h2 className="truncate text-2xl font-semibold text-zinc-900 pt-2">{post.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xl text-zinc-800">
                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-bold text-white"
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
