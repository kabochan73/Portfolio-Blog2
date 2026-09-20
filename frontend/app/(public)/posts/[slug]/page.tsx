import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/posts/MarkdownContent";
import { formatDate } from "@/lib/format";
import { getPost } from "@/lib/public/api";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div>
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
  );
}
