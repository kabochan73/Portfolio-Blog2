import type { ReactNode } from "react";

type PillProps = {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

/** A toggleable pill button — tag/status selection, filter tabs. */
export function Pill({ selected = false, onClick, children, className = "" }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border-2 px-3 py-1 text-sm font-bold transition-colors ${
        selected
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-900"
      } ${className}`}
    >
      {children}
    </button>
  );
}
