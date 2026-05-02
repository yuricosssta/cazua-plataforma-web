//src/components/auth/SessionExpiredModal.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { selectSessionExpired, logout } from '@/lib/redux/slices/authSlice';
import { ShieldAlert, LogIn } from 'lucide-react';

export const SessionExpiredModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isSessionExpired = useSelector(selectSessionExpired);
  const router = useRouter();

  const handleClose = () => {
    dispatch(logout());
    router.push('/login');
  };

  if (!isSessionExpired) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Faixa de Destaque no Topo */}
        <div className="h-1.5 w-full bg-red-500"></div>

        <div className="p-8 text-center flex flex-col items-center">
          
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-red-50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-3">
            Sessão Expirada
          </h2>
          
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Por motivos de segurança, sua conexão ao sistema foi encerrada. Você precisa se autenticar novamente para continuar operando.
          </p>

          <button
            onClick={handleClose}
            className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Ir para a tela de Login
          </button>

        </div>
      </div>
    </div>
  );
};