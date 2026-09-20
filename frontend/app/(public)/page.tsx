import { PostList } from "@/components/posts/PostList";
import { Sidebar } from "@/components/tags/Sidebar";
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
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="flex-1">
        <p className="text-sm font-semibold tracking-wide text-zinc-500">ARTICLES</p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">記事一覧</h1>
        <div className="mt-6">
          <PostList posts={posts} />
        </div>
      </div>
      <Sidebar tags={tags} counts={counts} />
    </div>
  );
}
