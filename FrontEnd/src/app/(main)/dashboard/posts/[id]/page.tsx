// src/app/(main)/dashboard/posts/[id]/page.tsx
"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { fetchPostById } from '@/lib/redux/slices/postsSlice';
import { BlogPostContent } from '@/components/posts/BlogPostContent';

export default function PostDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  
  const id = params.id as string; 

  const { currentPost, status, error } = useSelector((state: RootState) => state.posts);

  useEffect(() => {
    if (id) {
      dispatch(fetchPostById(id));
    }
  }, [id, dispatch]);

  if (status === 'loading' || !currentPost) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Carregando informações da publicação...
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-sm text-destructive font-medium">
          Erro ao carregar a publicação: {error}
        </p>
      </div>
    );
  }

  if (currentPost.id !== id) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Sincronizando publicação...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10"> 
      <BlogPostContent post={currentPost} />
    </div>
  );
}