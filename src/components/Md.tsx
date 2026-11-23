import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Markdown + LaTeX ($inline$, $$block$$). Raw HTML in the source is not rendered.
export default function Md({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`md ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{children}</ReactMarkdown>
    </div>
  );
}
