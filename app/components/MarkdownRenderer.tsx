"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  isDarkMode: boolean;
}

export default function MarkdownRenderer({ content, isDarkMode }: MarkdownRendererProps) {
  const linkColor = isDarkMode ? "text-[#9ECDB8]" : "text-[#4A7C59]";
  const codeBlockBg = isDarkMode ? "bg-[#1a251e]" : "bg-[#E8EDE9]";
  const inlineCodeBg = isDarkMode ? "bg-[#1a251e]" : "bg-[#E8EDE9]";
  const hrColor = isDarkMode ? "border-[#1F3326]" : "border-[#D8E6DB]";

  return (
    <ReactMarkdown
      components={{
        // Paragraphs
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        
        // Headers
        h1: ({ children }) => <h1 className="text-xl font-semibold mb-3 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>,
        
        // Lists
        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,
        
        // Links
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`underline underline-offset-2 hover:opacity-80 ${linkColor}`}
          >
            {children}
          </a>
        ),
        
        // Code
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className={`block p-3 rounded-lg my-2 overflow-x-auto text-sm font-mono ${codeBlockBg}`}>
                {children}
              </code>
            );
          }
          return (
            <code className={`px-1.5 py-0.5 rounded text-sm font-mono ${inlineCodeBg}`}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="my-2">{children}</pre>,
        
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className={`border-l-2 ${hrColor} pl-4 my-3 italic opacity-90`}>
            {children}
          </blockquote>
        ),
        
        // Horizontal rule
        hr: () => <hr className={`my-4 border-t ${hrColor}`} />,
        
        // Strong & emphasis
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
