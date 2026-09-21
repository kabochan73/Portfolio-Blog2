import Link from "next/link";
import type { ReactNode } from "react";

type CardProps = {
  /** Renders the card as a Link and adds a press-down effect when set. */
  href?: string;
  children: ReactNode;
  className?: string;
};

const base =
  "rounded-xl border-2 border-zinc-400 bg-white shadow-[4px_4px_0_0_#18181b] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#18181b]";
const pressable =
  "active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0_0_#18181b]";

export function Card({ href, children, className = "" }: CardProps) {
  const classes = `${base} ${href ? pressable : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}
