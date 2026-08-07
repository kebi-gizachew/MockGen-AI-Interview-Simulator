import React from 'react';

/**
 * Tiny, safe markdown-ish renderer (no dangerouslySetInnerHTML).
 * Supports: ## headings, **bold**, `inline code`, - bullets, blank-line paragraphs.
 */
export interface SimpleMarkdownProps {
  text: string;
}

const renderInline = (text: string, keyBase: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(
        <strong key={`${keyBase}-b${key++}`} className="text-purple-300 font-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code
          key={`${keyBase}-c${key++}`}
          className="px-1 py-0.5 rounded bg-slate-800/80 text-purple-300 font-mono text-[0.85em] border border-slate-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ text }) => {
  const lines = String(text || '').split('\n');

  const blocks: React.ReactNode[] = [];
  let bulletGroup: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletGroup.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`} className="list-disc list-inside space-y-1 my-1.5">
        {bulletGroup.map((line, i) => (
          <li key={i}>{renderInline(line.slice(2), `li-${key}-${i}`)}</li>
        ))}
      </ul>
    );
    bulletGroup = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      flushBullets();
      blocks.push(
        <h4 key={`h-${key++}`} className="text-sm font-extrabold text-purple-300 uppercase tracking-wide mt-3 mb-1 first:mt-0">
          {renderInline(trimmed.slice(3), `h-${key}`)}
        </h4>
      );
    } else if (trimmed.startsWith('- ')) {
      bulletGroup.push(trimmed);
    } else if (trimmed === '') {
      flushBullets();
      blocks.push(<div key={`sp-${key++}`} className="h-2" />);
    } else {
      flushBullets();
      blocks.push(
        <p key={`p-${key++}`} className="leading-relaxed">
          {renderInline(trimmed, `p-${key}`)}
        </p>
      );
    }
  }
  flushBullets();

  return <>{blocks}</>;
};
