"use client";

import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/lib/redux/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const router = useRouter();
// Redireciona para a página de login se o usuário não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Renderiza um loader ou null enquanto verifica a autenticação para evitar piscar a tela
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      {/* <main className="p-8">  */}
      {/* <Navbar /> */}
      {children}
      {/* <Footer /> */}
      {/* </main>       */}
    </div>
  );
}