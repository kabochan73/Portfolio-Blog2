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
    <ul className="flex flex-col gap-2">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  post.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {post.status === "published" ? "公開" : "下書き"}
              </span>
              <Link
                href={`/admin/posts/${post.id}`}
                className="truncate font-medium text-zinc-900 hover:underline"
              >
                {post.title}
              </Link>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{formatDate(post.created_at)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              編集
            </Link>
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
