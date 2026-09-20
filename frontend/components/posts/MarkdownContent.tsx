import { MarkdownAsync } from "react-markdown";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "@/components/posts/CodeBlock";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="prose prose-zinc max-w-none">
      <MarkdownAsync
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypePrettyCode, { theme: "github-dark", keepBackground: true }]]}
        components={{ pre: CodeBlock }}
      >
        {children}
      </MarkdownAsync>
    </div>
  );
}
