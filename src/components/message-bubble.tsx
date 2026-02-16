"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  content: string;
  role: "user" | "assistant";
}

export function MessageBubble({ content, role }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className} text-xs`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre
              className="overflow-x-auto rounded-lg bg-muted p-4 text-xs"
              {...props}
            >
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
