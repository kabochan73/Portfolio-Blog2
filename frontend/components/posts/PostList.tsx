import { Card } from "@/components/ui/Card";
import { TagBadge } from "@/components/ui/TagBadge";
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
          <Card href={`/posts/${post.slug}`} className="flex gap-4 p-4">
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
                <h2 className="truncate pt-2 text-2xl font-semibold text-zinc-900">
                  {post.title}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xl text-zinc-800">
                <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
                {post.tags.map((tag) => (
                  <TagBadge key={tag.id}>{tag.name}</TagBadge>
                ))}
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
