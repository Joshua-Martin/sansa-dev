import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  condense?: boolean;
}

/**
 * Component for rendering Markdown content
 * @param content - The markdown content to render
 * @param className - Optional additional CSS classes
 * @param condense - If true, reduces text sizes (headers by 50%, other text by 25%)
 */
export function MarkdownRenderer({
  content,
  className,
  condense = false,
}: MarkdownRendererProps) {
  /**
   * Preprocesses the markdown content to convert custom bullet points (•)
   * into standard markdown list items (-).
   * @param {string} text - The raw markdown string.
   * @returns {string} The processed markdown string with standard list syntax.
   */
  const preprocessContent = (text: string): string => {
    return text
      .split('\n')
      .map((line) => {
        if (line.trim().startsWith('• ')) {
          return line.replace('• ', '- ');
        }
        return line;
      })
      .join('\n');
  };

  const processedContent = preprocessContent(content);

  return (
    <div className={className}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom components for markdown elements
          h1: ({ node, ...props }) => (
            <h1
              className={`${
                condense ? 'text-xl' : 'text-2xl'
              } font-bold mb-4 mt-6`}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className={`${
                condense ? 'text-lg' : 'text-xl'
              } font-bold mb-3 mt-5`}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className={`${
                condense ? 'text-base' : 'text-lg'
              } font-semibold mb-3 mt-4`}
              {...props}
            />
          ),
          p: ({ node, children, ...props }) => (
            <p className={`mb-4 ${condense ? 'text-sm' : ''}`} {...props}>
              {React.Children.map(children, (child) => {
                if (typeof child === 'string') {
                  const parts = child.split(/(\{\{[^}]+\}\})/g);
                  return parts.map((part, index) => {
                    if (/^\{\{.+\}\}$/.test(part)) {
                      return (
                        <span
                          key={index}
                          className="text-green-600 font-medium"
                        >
                          {part}
                        </span>
                      );
                    }
                    return part;
                  });
                }
                return child;
              })}
            </p>
          ),
          ul: ({ node, ...props }) => (
            <ul
              className={`list-disc pl-6 mb-4 ${condense ? 'text-sm' : ''}`}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className={`list-decimal pl-6 mb-4 ${condense ? 'text-sm' : ''}`}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className={`mb-1 ${condense ? 'text-sm' : ''}`} {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className={`text-primary underline hover:text-primary/80 ${
                condense ? 'text-sm' : ''
              }`}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className={`border-l-4 border-muted pl-4 italic my-4 ${
                condense ? 'text-sm' : ''
              }`}
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }) => {
            return (
              <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-4">
                <code
                  className={`${className} ${condense ? 'text-xs' : 'text-sm'}`}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            );
          },
          hr: ({ node, ...props }) => (
            <hr className="border-t border-border my-6" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table
                className={`border-collapse border border-border w-full ${
                  condense ? 'text-sm' : ''
                }`}
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => (
            <tr className="border-b border-border" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className={`border border-border px-4 py-2 text-left ${
                condense ? 'text-sm' : ''
              }`}
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className={`border border-border px-4 py-2 ${
                condense ? 'text-sm' : ''
              }`}
              {...props}
            />
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
