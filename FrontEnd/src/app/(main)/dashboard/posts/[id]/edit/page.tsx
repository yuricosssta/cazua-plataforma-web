// src/app/(main)/dashboard/posts/[id]/edit/page.tsx
"use client";

import PostForm from '@/components/posts/PostForm';
import { fetchPostById, updatePost, deletePost } from '@/lib/redux/slices/postsSlice';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { IPost } from '@/types/post';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2 } from 'lucide-react';

export default function EditPostPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  
  const id = params.id as string;

  const { currentPost, status } = useSelector((state: RootState) => state.posts);

  useEffect(() => {
    if (id) {
      dispatch(fetchPostById(id));
    }
  }, [id, dispatch]);

  const handleSubmit = (postData: IPost | Omit<IPost, 'id'>) => {
    dispatch(updatePost({ id, data: postData })).then(() => {
      router.push('/dashboard/posts'); // CORREÇÃO: Path absoluto
    });
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja deletar esta publicação? Esta ação não pode ser desfeita.')) {
      dispatch(deletePost(id)).then(() => {
        router.push('/dashboard/posts'); 
      });
    }
  };

  if (!currentPost || currentPost.id !== id) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Carregando dados da publicação...
        </p>
      </div>
    );
  }

  return (
    <div className="relative pt-30 max-w-6xl mx-auto px-4 py-8 break-words">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Editar Publicação</h1>
      
      <PostForm 
        onSubmit={handleSubmit} 
        initialData={currentPost}
        isLoading={status === 'loading'} 
      />
      
      <div className="mt-8 pt-6 border-t border-border flex justify-end">
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2 gap-2 shadow-sm"
        >
          <Trash2 size={16} />
          Deletar Publicação
        </button>
      </div>
    </div>
  );
}