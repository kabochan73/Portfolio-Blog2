import type { ReactNode } from "react";

/** Non-interactive display badge for a post's tags (list cards, detail pages). */
export function TagBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-white">
      {children}
    </span>
  );
}
