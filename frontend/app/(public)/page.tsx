import { PostBrowser } from "@/components/posts/PostBrowser";
import { getPosts, getTags } from "@/lib/public/api";

export default async function HomePage() {
  const [posts, tags] = await Promise.all([getPosts(), getTags()]);

  const counts: Record<number, number> = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      counts[tag.id] = (counts[tag.id] ?? 0) + 1;
    }
  }

  return (
    <PostBrowser posts={posts} tags={tags} counts={counts}>
      <h1 className="mt-1 text-4xl font-bold text-zinc-900">ARTICLE</h1>
      <p className="mt-2 text-xs text-zinc-600">
        Laravel, Next.js, AWS,などの学習記録や、日々の気づきなどを投稿しています。
      </p>
      <div className="mt-6" />
    </PostBrowser>
  );
}
