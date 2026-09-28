import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const InlineMarkdown = ({ content, className = '' }) => {
  if (!content) return null;

  const hasMarkdown = /\$/.test(content) || /\*\*/.test(content) || /\*[^*]+\*/.test(content);

  if (!hasMarkdown) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => <span {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </span>
  );
};

export default InlineMarkdown;