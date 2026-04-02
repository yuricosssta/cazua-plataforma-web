"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { fetchUserProfile } from '@/lib/redux/slices/userSlice';

export const UserProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, status, error } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile()); 
  }, [dispatch]);

  if (status === 'loading') {
    return <div>Carregando perfil...</div>;
  }

  if (status === 'failed') {
    return <div className="text-red-500">Erro ao carregar perfil: {error}</div>;
  }

  if (!profile) {
    return <div>Nenhum perfil encontrado.</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-sm shadow-md overflow-hidden md:max-w-2xl p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Perfil do Usuário</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Nome</label>
          <p className="text-lg text-gray-900">{profile.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Email</label>
          <p className="text-lg text-gray-900">{profile.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Tipo de Usuário</label>
          <p className="text-lg text-gray-900 capitalize">{profile.rule || 'Não definido'}</p>
        </div>
        <div className="pt-4">
          {/* A lógica para a mudança de senha seria uma nova feature  */}
          <button className="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-neutral-950 hover:bg-neutral-700 disabled:bg-neutral-300">
            Mudar a Senha
          </button>
        </div>
      </div>
    </div>
  );
};