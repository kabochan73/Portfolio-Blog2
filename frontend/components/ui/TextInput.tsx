import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`rounded-lg border-2 border-zinc-300 px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900 ${className}`}
        {...props}
      />
    );
  },
);
