import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * Render teks yang mengandung LaTeX ($...$ untuk inline, $$...$$ untuk block)
 * jadi tampilan matematika cantik kayak Word Equation.
 */
const MathRenderer = ({ text, className = '' }) => {
  const rendered = useMemo(() => {
    if (!text) return '';

    // ⚡ Split teks jadi bagian-bagian: teks biasa + LaTeX
    // Match: $$...$$  atau  $...$  atau  \[...\]  atau  \(...\)
    const parts = [];
    let lastIndex = 0;
    
    // Regex: prioritas block math ($$...$$), lalu inline ($...$)
    const regex = /\$\$([^$]+?)\$\$|\$([^$]+?)\$|\\\[([^\]]+?)\\\]|\\\(([^)]+?)\\\)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Push text sebelum math
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }

      // Tentukan jenis math
      const mathContent = match[1] || match[2] || match[3] || match[4];
      const isBlock = !!(match[1] || match[3]); // $$ atau \[ → block

      parts.push({ type: 'math', content: mathContent, isBlock });
      lastIndex = regex.lastIndex;
    }

    // Sisa text terakhir
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts;
  }, [text]);

  // ⚡ Handle format **bold** juga di teks biasa
  const renderTextPart = (content, key) => {
    const boldParts = content.split('**');
    return (
      <span key={key}>
        {boldParts.map((part, i) => 
          i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  const renderMathPart = (content, isBlock, key) => {
    try {
      const html = katex.renderToString(content, {
        displayMode: isBlock,
        throwOnError: false,
        strict: false,
        trust: true,
      });
      return (
        <span 
          key={key} 
          dangerouslySetInnerHTML={{ __html: html }} 
          className={isBlock ? 'block my-2 text-center overflow-x-auto' : 'inline'}
        />
      );
    } catch (err) {
      console.error('KaTeX render error:', err);
      // Fallback: tampilkan raw kalau gagal
      return <code key={key} className="text-xs bg-gray-100 dark:bg-slate-700 px-1 rounded">{content}</code>;
    }
  };

  return (
    <span className={className}>
      {Array.isArray(rendered) 
        ? rendered.map((part, idx) => 
            part.type === 'math' 
              ? renderMathPart(part.content, part.isBlock, idx)
              : renderTextPart(part.content, idx)
          )
        : rendered
      }
    </span>
  );
};

export default MathRenderer;