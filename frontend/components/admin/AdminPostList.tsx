import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { Post } from "@/types";

type AdminPostListProps = {
  posts: Post[];
  onDelete: (id: number) => void;
};

export function AdminPostList({ posts, onDelete }: AdminPostListProps) {
  if (posts.length === 0) {
    return <p className="text-zinc-500">記事がありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex gap-4 rounded-xl border-2 border-zinc-400 bg-white p-4 shadow-[4px_4px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#18181b]"
        >
          <div className="h-28 w-42 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            {post.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <Link
                href={`/admin/posts/${post.id}`}
                className="block truncate text-2xl font-semibold text-zinc-900 hover:underline"
              >
                {post.title}
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
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
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/posts/${post.id}/edit`}
                  className="rounded-lg border-2 border-zinc-900 px-3 py-1 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white"
                >
                  編集
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(post.id)}
                  className="rounded-lg border-2 border-red-600 px-3 py-1 text-sm font-bold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
