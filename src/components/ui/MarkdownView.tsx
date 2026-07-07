import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string | null | undefined;
  className?: string;
  emptyText?: string;
}

/**
 * Renders Markdown (GitHub-flavored) as neatly formatted, sanitized content.
 * Raw HTML is intentionally not enabled to avoid XSS.
 */
export const MarkdownView = ({
  content,
  className = '',
  emptyText = 'No content is available.',
}: MarkdownViewProps) => {
  const trimmed = (content ?? '').trim();

  if (!trimmed) {
    return <p className="text-slate-400 italic">{emptyText}</p>;
  }

  return (
    <div
      className={
        'prose prose-slate max-w-none ' +
        'prose-headings:font-black prose-headings:text-slate-900 ' +
        'prose-h1:text-base prose-h2:text-sm prose-h3:text-xs ' +
        'prose-p:text-slate-700 prose-p:leading-relaxed ' +
        'prose-li:text-slate-700 prose-li:my-0.5 ' +
        'prose-strong:text-slate-900 prose-a:text-brand-hover ' +
        'prose-ul:my-2 prose-ol:my-2 prose-headings:mt-4 prose-headings:mb-2 ' +
        className
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{trimmed}</ReactMarkdown>
    </div>
  );
};

export default MarkdownView;
