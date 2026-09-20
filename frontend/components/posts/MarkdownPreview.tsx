"use client";

import { MarkdownHooks } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "@/components/posts/CodeBlock";

/**
 * Client-side counterpart to MarkdownContent, for the admin form's live
 * preview tab. rehype-pretty-code loads shiki asynchronously, so this uses
 * react-markdown's MarkdownHooks (not the sync default export) to render in
 * the browser — MarkdownAsync only works from a Server Component.
 */
export function MarkdownPreview({ children }: { children: string }) {
  return (
    <div className="prose prose-zinc max-w-none">
      <MarkdownHooks
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypePrettyCode, { theme: "github-dark", keepBackground: true }]]}
        components={{ pre: CodeBlock }}
      >
        {children}
      </MarkdownHooks>
    </div>
  );
}
