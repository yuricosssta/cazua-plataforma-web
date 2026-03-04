"use client";

import PostForm from '@/components/PostForm';
import { fetchPostById, updatePost, deletePost } from '@/lib/redux/slices/postsSlice';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { IPost } from '@/types/IPost';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export default function EditPostPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const id = params._id as string;

  const { currentPost, status } = useSelector((state: RootState) => state.posts);

  useEffect(() => {
    if (id) {
      dispatch(fetchPostById(id));
    }
  }, [id, dispatch]);

  const handleSubmit = (postData: IPost) => {
    dispatch(updatePost(postData)).then(() => {
      router.push('/posts');
    });
  };

  const handleDelete = () => {
    // Adiciona uma confirmação para o usuário
    if (window.confirm('Tem certeza que deseja deletar esta publicação? Esta ação não pode ser desfeita.')) {
      dispatch(deletePost(id)).then(() => {
        router.push('/posts'); // Redireciona para a lista de posts após deletar
      });
    }
  };

  if (!currentPost || currentPost._id !== id) {
    return <p>Carregando dados do post...</p>;
  }

  return (
    <div className="relative pt-30 max-w-6xl mx-auto px-4 py-8 break-words">
      <h1 className="text-3xl font-bold mb-6">Editar Publicação</h1>
      <PostForm 
        onSubmit={handleSubmit} 
        initialData={currentPost}
        isLoading={status === 'loading'} 
      />
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          type="button" // 'type="button"' impede que o botão envie o formulário
          onClick={handleDelete}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
        >
          Deletar Publicação
        </button>
      </div>
    </div>
  );
}