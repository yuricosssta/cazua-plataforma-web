// src/components/posts/BlogPostContent.tsx
"use client";

import { IPost } from "@/types/post";
import Link from "next/link";
import MarkdownPreview from "./MarkdownPreview";
import { ArrowLeft, Calendar, User, Edit } from "lucide-react";

export const BlogPostContent = ({ post }: { post: IPost | null }) => {
  if (!post) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-lg font-medium">Página não encontrada</p>
        <Link href="/dashboard/posts" className="mt-4 text-primary hover:underline">
          Voltar para todas as publicações
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen transition-colors duration-300">
      <div className="flex-1 mx-auto px-4 py-4 md:py-4">

        <Link
          href="/dashboard/posts"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para todas as publicações
        </Link>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
            {post.title}
          </h1>

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

        {/* CORREÇÃO 3: aspect-video adicionado para evitar deslocamento de layout; rounded-md padronizado */}
        <div className="relative w-full aspect-video overflow-hidden rounded-md border border-border bg-muted mb-10 shadow-sm">
          <img
            src={post.image || "https://placehold.co/1200x600"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        <article className="typography max-w-none">
          <MarkdownPreview markdown={post.content || "Sem conteúdo disponível."} />
        </article>

        <div className="mt-16 pt-8 border-t border-border">
          {/* CORREÇÃO 2: Roteamento absoluto para se manter na área autenticada */}
          <Link
            href={`/dashboard/posts/${post.id}/edit`}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </div>

      </div>
    </div>
  );
};