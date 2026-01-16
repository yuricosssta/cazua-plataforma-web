"use client";

import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { AppDispatch } from '@/lib/redux/store';
import { logout, selectIsAuthenticated, selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle, Download, Database, Lock, ArrowRight } from 'lucide-react';

export const UserNav = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
    // Redireciona para a página de login após o logout
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-4">
      {/* {isAuthenticated && user ? (
        <>
          <span className="text-sm text-gray-600">
            Olá, <Link href="/profile" className="font-bold hover:underline">{user.email}</Link>
          </span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
          >
            Sair
          </button>
        </>
      ) : (
        <Link 
          href="/login" 
          className="bg-blue-500 text-white px-3 py-1 text-sm rounded-none hover:bg-blue-600"
        >
          Login
        </Link>
      )} */}
      {/* Botão de Login */}
      <button
        type="button"
        onClick={() => router.push(`/dashboard`)}
        className="md:flex items-center gap-2 bg-stone-900 hover:bg-stone-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm"
      >
        <Lock size={14} />
        Área de Membros
      </button>
    </div>
  );
};