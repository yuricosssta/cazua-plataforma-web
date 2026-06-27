// FrontEnd/src/components/PostList.tsx
"use client";

import Link from "next/link";
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { fetchPosts, deletePost } from '@/lib/redux/slices/postsSlice';
import { Trash2, Edit2, Plus } from "lucide-react";

export const PostList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { posts, status, error, currentPage, totalPages } = useSelector((state: RootState) => state.posts);
  const currentOrg = useSelector((state: any) => state.organizations?.currentOrganization);
  const user = useSelector((state: any) => state.auth?.user);

  // Validação estrita: É ADMIN da organização, DONO, ou ADMIN global do sistema.
  const isAdmin = currentOrg?.role === 'ADMIN' || currentOrg?.role === 'OWNER' || user?.role === 'ADMIN';

  useEffect(() => {
    dispatch(fetchPosts({ page: 1 }));
  }, [dispatch]);

  const handlePageChange = (newPage: number) => {
    dispatch(fetchPosts({ page: newPage }));
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta publicação?')) {
      dispatch(deletePost(id)).then(() => {
        if (posts.length === 1 && currentPage > 1) {
          handlePageChange(currentPage - 1);
        } else {
          dispatch(fetchPosts({ page: currentPage }));
        }
      });
    }
  };

  // 1. Loading State
  if (status === 'loading' && posts.length === 0) {
    return (
      <div className="flex justify-center items-center py-20 bg-background min-h-screen">
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Carregando publicações...</p>
      </div>
    );
  }

  // 2. Error State
  if (status === 'failed') {
    return (
      <div className="flex justify-center items-center py-20 bg-background min-h-screen">
        <p className="text-sm text-destructive font-medium">Erro ao carregar posts: {error}</p>
      </div>
    );
  }

  // 3. Empty State (Sem publicações + Validação Admin)
  if (status === 'succeeded' && posts.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 bg-background text-foreground transition-colors duration-300">
        <p className="text-lg text-muted-foreground font-medium">Nenhuma publicação encontrada nesta organização.</p>
        
        {isAdmin && (
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 gap-2 shadow-sm mt-2"
          >
            <Plus size={16} />
            Criar Primeira Publicação
          </Link>
        )}
      </div>
    );
  }

  // 4. Populated State (Com publicações)
  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
      
      {/* Header de Ações: Aparece se houver posts E for administrador */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 pt-8 pb-8 gap-4 border-b border-border mb-8 mx-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Avisos e Publicações</h1>
        
        {isAdmin && (
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2 shadow-sm"
          >
            <Plus size={16} />
            Nova Publicação
          </Link>
        )}
      </div>

      {/* Grid de Publicações */}
      <div
        className={`relative pb-24 px-4 overflow-hidden grid grid-cols-1 gap-16 md:grid-cols-2 transition-opacity duration-300 ${status === 'loading' ? 'opacity-50' : 'opacity-100'}`}
      >
        {posts.map((post) => (
          <div className="break-words flex flex-col" key={post.id}>
            <Link href={`/dashboard/posts/${post.id}`}>
              {/* <div className="fill aspect-[16/9] relative cursor-pointer bg-muted rounded-md overflow-hidden border border-border shadow-sm">
                 <img 
                  alt={post.title} 
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  src={post.image || "https://placehold.co/600x400"}
                /> 
              </div> */}
            </Link>
            <div className="flex flex-col flex-grow gap-3 mt-4">
              <h2 className="font-sans font-semibold tracking-tighter text-primary text-2xl md:text-3xl hover:text-primary/80 transition-colors">
                <Link href={`/dashboard/posts/${post.id}`}>{post.title}</Link>
              </h2>
              
              <div className="prose lg:prose-lg leading-relaxed text-muted-foreground line-clamp-3">
                {post.description || post.content}
              </div>
              
              <div className="flex flex-col gap-1 mt-auto pt-4 border-t border-border">
                <div className="text-sm font-medium text-muted-foreground mt-2">
                  {post.author} | {Intl.DateTimeFormat("pt-br", { dateStyle: 'medium' }).format(
                    new Date(post.modified_at || post.created_at || new Date())
                  )}
                </div>
                
                {/* Controles do Card (Apenas Administradores) */}
                {isAdmin && (
                  <div className="flex items-center gap-2 mt-3">
                    <Link 
                      href={`/dashboard/posts/${post.id}/edit`} 
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 gap-2"
                    >
                      <Edit2 size={14} />
                      Editar
                    </Link>
                    <button
                      onClick={() => post.id && handleDelete(post.id)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground h-9 px-4 gap-2"
                    >
                      <Trash2 size={14} />
                      Deletar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-10 text-foreground border-t border-border pt-8 mx-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || status === 'loading'}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Anterior
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || status === 'loading'}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};