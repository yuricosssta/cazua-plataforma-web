// src/app/(main)/dashboard/posts/new/page.tsx
"use client";

import { useState } from 'react';
import PostForm from '@/components/posts/PostForm';
import { createNewPost } from '@/lib/redux/slices/postsSlice';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { IPost } from '@/types/post';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

export default function NewPostPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { status, error: reduxError } = useSelector((state: RootState) => state.posts);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (postData: Omit<IPost, 'id'> | IPost) => {
    setLocalError(null);
    
    dispatch(createNewPost(postData as Omit<IPost, 'id'>))
      .unwrap()
      .then(() => {
        router.push('/dashboard/posts');
      })
      .catch((err: any) => {
        setLocalError(err.message || err.error || reduxError || 'Ocorreu um erro ao salvar a publicação. Verifique os dados.');
      });
  };

  return (
    <div className="relative pt-30 max-w-6xl mx-auto px-4 py-8 break-words"> 
      <h1 className="text-3xl font-bold mb-6 text-foreground">Criar Nova Publicação</h1>
      <PostForm 
        onSubmit={handleSubmit} 
        isLoading={status === 'loading'} 
        serverError={localError} 
      />
    </div>
  );
}