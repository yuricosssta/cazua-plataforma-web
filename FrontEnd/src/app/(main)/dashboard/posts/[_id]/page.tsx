"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { fetchPostById } from '@/lib/redux/slices/postsSlice';
import { BlogPostContent } from '@/components/BlogPostContent';
import { Footer } from '@/components/Footer';

export default function PostDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const id = params._id as string; // Pega o ID da URL

  // Seleciona os dados relevantes do estado do Redux
  const { currentPost, status, error } = useSelector((state: RootState) => state.posts);

  // Efeito para buscar os dados do post quando o componente é montado ou o ID muda
  useEffect(() => {
    if (id) {
      // Dispara a ação para buscar o post pelo ID
      dispatch(fetchPostById(id));
    }
  }, [id, dispatch]);

  // Renderiza um estado de carregamento enquanto a requisição está em andamento
  if (status === 'loading' || !currentPost) {
    console.log('Carregando post com ID:', id);
    console.log('Status atual:', status);
    console.log('Post atual:', currentPost);
    return <div className="text-center mt-10">Carregando informações...</div>;
  }

  // Renderiza uma mensagem de erro se a requisição falhar
  if (status === 'failed') {
    return <div className="text-center mt-10 text-red-500">Erro ao carregar a publicação: {error}</div>;
  }

  // Garante que o post carregado corresponde ao ID da URL para evitar mostrar dados antigos
  if (currentPost._id !== id) {
    return <div className="text-center mt-10">Carregando publicação...</div>;
  }

  return (

    // <div className="container mx-auto px-5">
    <div className="relative pt-30 max-w-6xl mx-auto px-4 py-8 break-words"> 
      <BlogPostContent post={currentPost} />
    </div>
    // </div>
  );
} 