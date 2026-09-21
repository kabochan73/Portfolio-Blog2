import type { Tag } from "@/types";

const PROFILE = {
  name: "久保　拓洋",
  bio: "Laravel と Next.js を中心に勉強しています。",
};

type SidebarProps = {
  tags: Tag[];
  counts: Record<number, number>;
  selectedKey: string;
  onSelect: (key: string) => void;
};

export function Sidebar({ tags, counts, selectedKey, onSelect }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-4 sm:w-72">
      <div className="border-2 border-zinc-800 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200" />
          <div>
            <p className="font-semibold text-zinc-900">{PROFILE.name}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-600">{PROFILE.bio}</p>
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
