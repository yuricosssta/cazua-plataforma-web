// src/components/BlogPostContent.tsx
"use client";

import { IPost } from "../types/IPost";
import Link from "next/link";
import MarkdownPreview from "./MarkdownPreview";
import { ArrowLeft, Calendar, User, Edit } from "lucide-react";

export const BlogPostContent = ({ post }: { post: IPost | null }) => {
  if (!post) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg">Página não encontrada</p>
        <Link href="/dashboard/posts" className="mt-4 text-primary hover:underline">
          Voltar para todas as publicações
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen transition-colors duration-300">
      
      {/* Container Centralizado */}
      <div className="flex-1 mx-auto px-4 py-4 md:py-4">
        
        {/* Botão Voltar */}
        <Link 
          href="/dashboard/posts" 
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
          Voltar para todas as publicações
        </Link>

        {/* Cabeçalho do Post */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
            {post.title}
          </h1>

          {/* Metadados (Autor e Data) */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-b border-border pb-8">
            {post.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
            )}
            
            {(post.modified_at || post.created_at) && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {Intl.DateTimeFormat("pt-br", { dateStyle: 'long' }).format(
                    new Date(post.modified_at || post.created_at || new Date())
                  )}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Imagem de Capa */}
        <div className="relative  w-full overflow-hidden rounded-sm border border-border bg-muted mb-10 shadow-sm">
           <img 
             src={post.image || "https://placehold.co/1200x600"} 
             alt={post.title} 
             className="w-full h-full object-cover" 
           />
        </div>

        {/* CONTEÚDO DO MARKDOWN 
            A classe 'typography' aplica os estilos globais que definimos no globals.css 
            (cores de h1, h2, p, a, blockquote, etc).
        */}
        <article className="typography max-w-none">
          <MarkdownPreview markdown={post.content || "Sem conteúdo disponível."} /> 
        </article>

        {/* Rodapé do Post (Botão Editar) */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link 
            href={`/posts/${post._id}/edit`} 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar este post
          </Link>
        </div>

      </div>
    </div>
  );
};

// //src/components/BlogPostContent.tsx
// "use client";

// import { IPost } from "../types/IPost";
// import Link from "next/link";
// import MarkdownPreview from "./MarkdownPreview";

// export const BlogPostContent = ({ post }: { post: IPost | null }) => {
//   if (!post) return <p>Página não encontrada</p>;

//     return (
//     <div>
//       {/* <div className="max-w-4xl mx-auto px-4 py-8 mb-10 lg:mt-20 break-words"> */}
//         <Link href="/posts" className="btn btn-secondary">
//           &larr; Voltar
//         </Link>

//         <h1 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight mb-4">
//           {post.title}
//         </h1>
//         <img src={post.image} alt={post.title} className="w-full h-auto rounded-lg mt-4" />
//         {/* <article className="prose lg:prose-xl dark:prose-invert max-w-none"> */}
//           <MarkdownPreview markdown={post.content || "Algo deu errado..."} /> 
//         {/* </article> */}

//         <div className="text-sm opacity-40 mt-4">
//           {post.author && <span>Por: {post.author}</span>}
//           {post.created_at &&
//             <span className="ml-4">
//               Atualizado em: {Intl.DateTimeFormat("pt-br").format(
//                 new Date(post.modified_at || post.created_at || new Date())
//               )}
//             </span>
//           }
//         </div>
//         <Link href={`/posts/${post._id}/edit`} className="btn btn-secondary">
//           Editar
//         </Link>

//     </div>
//   );
// };

