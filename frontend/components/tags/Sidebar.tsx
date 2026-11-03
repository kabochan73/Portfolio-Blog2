import Image from "next/image";

import type { Tag } from "@/types";

const PROFILE = {
  name: "久保　拓洋",
  bio: "Laravel と Next.js を中心に勉強しています。",
  githubUrl: "https://github.com/kabochan73",
};

type SidebarProps = {
  tags: Tag[];
  counts: Record<number, number>;
  selectedKey: string;
  onSelect: (key: string) => void;
};

export function Sidebar({ tags, counts, selectedKey, onSelect }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-4 self-start sm:sticky sm:top-6 sm:w-72">
      <div className="border-2 border-zinc-800 bg-white p-4">
        <div className="flex items-center gap-3">
          <Image
            src="/profile.jpeg"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-zinc-900">{PROFILE.name}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-600">{PROFILE.bio}</p>
        <a
          href={PROFILE.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current" aria-hidden="true">
            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15 0 1.55-.01 2.8-.01 3.18 0 .3.21.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
          </svg>
          GitHub
        </a>
      </div>

      <div className="bg-white p-4">
        <p className="border-b-2 border-zinc-800 pb-2 text-2xl font-semibold tracking-widest text-zinc-900">
          TAGS
        </p>
        <ul className="flex flex-col">
          {tags.map((tag) => {
            const key = String(tag.id);
            const isSelected = selectedKey === key;

            return (
              <li key={tag.id}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center justify-between mt-2 px-2 py-2 text-sm transition-colors border-b-2 border-zinc-600 ${
                    isSelected ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="font-bold text-xl">{tag.name}</span>
                  <span className="flex items-center gap-2">
                    <span className={isSelected ? "text-white" : "text-zinc-800"}>
                      {counts[tag.id] ?? 0}
                    </span>
                    <span className={isSelected ? "text-white" : "text-zinc-800"}>›</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
