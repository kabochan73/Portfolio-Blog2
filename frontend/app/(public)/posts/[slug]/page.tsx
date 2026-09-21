import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/posts/MarkdownContent";
import { TagBadge } from "@/components/ui/TagBadge";
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
    <div className="w-full max-w-4xl self-center p-4 sm:px-6 lg:px-8">

      <h1 className="mt-3 text-4xl font-bold text-zinc-900">{post.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <time dateTime={post.created_at} className="text-xl text-zinc-800">
          {formatDate(post.created_at)}
        </time>
        {post.tags.map((tag) => (
          <TagBadge key={tag.id}>{tag.name}</TagBadge>
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

      <Link href="/" className="flex justify-end text-xl  text-zinc-800 hover:text-zinc-600">
        ← Back
      </Link>
    </div>
  );
}
