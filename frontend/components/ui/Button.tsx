import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2 text-sm",
};

const variantClasses: Record<Variant, string> = {
  primary:
    "border-zinc-900 bg-zinc-900 text-white shadow-[3px_3px_0_0_#18181b] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#18181b] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none",
  outline: "border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white",
  ghost: "border-zinc-300 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900",
  danger: "border-red-600 text-red-600 hover:bg-red-600 hover:text-white",
};

const base = "inline-flex items-center justify-center rounded-lg border-2 font-bold transition-all disabled:pointer-events-none disabled:opacity-50";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = `${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
