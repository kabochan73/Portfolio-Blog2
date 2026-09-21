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
    <div className="w-full max-w-4xl self-center px-4 py-8 sm:px-6 lg:px-8">


      <h1 className="mt-3 text-3xl font-bold text-zinc-900">{post.title}</h1>
      <time dateTime={post.created_at} className="mt-2 block text-sm text-zinc-500">
        {formatDate(post.created_at)}
      </time>
      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white"
          >
            {tag.name}
          </span>
        ))}
      </div>

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

      <Link href="/" className="flex justify-end text-lg  text-zinc-500 hover:text-zinc-700">
        ← 一覧に戻る
      </Link>
    </div>
  );
}
