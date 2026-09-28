import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 pb-3 border-b-2 border-teal-200 dark:border-teal-800" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-3 pl-3 border-l-4 border-teal-500" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-4" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1.5 text-gray-700 dark:text-gray-300" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-gray-700 dark:text-gray-300" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-teal-700 dark:text-teal-400" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800 dark:text-gray-200" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-r-lg mb-4 italic text-gray-700 dark:text-gray-300" {...props} />
          ),
          code: ({ node, inline, ...props }) => {
            if (inline) {
              return (
                <code className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
              );
            }
            return (
              <code className="block bg-slate-900 dark:bg-slate-950 text-teal-300 p-4 rounded-xl text-sm font-mono overflow-x-auto mb-4" {...props} />
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-teal-50 dark:bg-teal-900/30" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-200 dark:border-slate-700 px-3 py-2 text-left font-bold text-gray-900 dark:text-white text-sm" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-200 dark:border-slate-700 px-3 py-2 text-gray-700 dark:text-gray-300 text-sm" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-teal-600 dark:text-teal-400 hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-gray-200 dark:border-slate-700" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;