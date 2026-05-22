//src/components/MarkdownPreview.tsx
"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Importe um tema de estilo para o realce de sintaxe.
// Você pode escolher outros temas da biblioteca 'highlight.js'.
// Este import pode ser feito aqui ou no seu globals.css.
// import 'highlight.js/styles/github-dark.css';

interface MarkdownPreviewProps {
  markdown: string;
}

export default function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  return (
    // A classe 'prose' do @tailwindcss/typography aplica estilos
    // elegantes a todo o conteúdo gerado pelo Markdown.
    // Use modificadores como prose-lg, prose-invert, etc., para customizar.
    <article className="typography">
      <ReactMarkdown
        // Passa o conteúdo Markdown como filho do componente
        remarkPlugins={[remarkGfm]}      // Ativa o plugin para tabelas, etc.
        rehypePlugins={[rehypeHighlight]} // Ativa o plugin para realce de código
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}

