import Link from "next/link";

import { formatDate } from "@/lib/format";
import type { Post, Tag } from "@/types";

const PROFILE = {
  name: "Takumi",
  role: "Web Engineer / Developer",
  bio: "Laravel と Next.js を中心に学習・開発しています。技術のアウトプットや、日々の学びをこのブログにまとめています。",
};

type SidebarProps = {
  tags: Tag[];
  counts: Record<number, number>;
  /** When provided, tags become clickable and the matching one is highlighted. */
  selectedKey?: string;
  onSelect?: (key: string) => void;
  /** Shown as a third card when provided (post detail page only). */
  related?: Post[];
};

export function Sidebar({ tags, counts, selectedKey, onSelect, related }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-4 sm:w-72">
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200" />
          <div>
            <p className="font-semibold text-zinc-900">{PROFILE.name}</p>
            <p className="text-sm text-zinc-500">{PROFILE.role}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-600">{PROFILE.bio}</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-zinc-900">TAGS</p>
        <ul className="flex flex-col">
          {tags.map((tag) => {
            const key = String(tag.id);
            const isSelected = selectedKey === key;

            const content = (
              <>
                <span>{tag.name}</span>
                <span className="text-zinc-400">{counts[tag.id] ?? 0}</span>
              </>
            );

            return (
              <li key={tag.id}>
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(key)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-zinc-700">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {related && related.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-zinc-900">関連記事</p>
          <ul className="flex flex-col gap-3">
            {related.map((post) => (
              <li key={post.id}>
                <Link href={`/posts/${post.slug}`} className="block hover:underline">
                  <p className="text-sm font-medium text-zinc-900">{post.title}</p>
                  <p className="text-xs text-zinc-500">{formatDate(post.created_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
