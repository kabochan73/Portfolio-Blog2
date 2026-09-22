import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TagBadge } from "@/components/ui/TagBadge";
import { formatDate } from "@/lib/format";
import type { Post } from "@/types";

type AdminPostListProps = {
  posts: Post[];
  onDelete: (id: number, slug: string) => void;
};

export function AdminPostList({ posts, onDelete }: AdminPostListProps) {
  if (posts.length === 0) {
    return <p className="text-zinc-500">記事がありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {posts.map((post) => (
        <li key={post.id}>
          <Card className="flex gap-4 p-4">
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
                    <TagBadge key={tag.id}>{tag.name}</TagBadge>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button href={`/admin/posts/${post.id}/edit`} variant="outline" size="sm">
                    編集
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDelete(post.id, post.slug)}>
                    削除
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
