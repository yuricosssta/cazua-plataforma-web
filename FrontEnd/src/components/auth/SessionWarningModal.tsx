// FrontEnd/src/components/auth/SessionWarningModal.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { renewToken, sessionExpired } from '@/lib/redux/slices/authSlice';
import { Clock, RefreshCw } from 'lucide-react';

export const SessionWarningModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    // Se não estiver logado ou não tiver a data de expiração, não faz nada
    if (!isAuthenticated || !user?.exp) {
      setShowWarning(false);
      return;
    }

    const checkExpiration = () => {
      const currentTime = Math.floor(Date.now() / 1000); // Segundos atuais
      const expTime = user.exp!; // Segundos da expiração do JWT
      const secondsRemaining = expTime - currentTime;

      // Se faltam 5 minutos (300 segundos) ou menos, aciona o alarme
      if (secondsRemaining > 0 && secondsRemaining <= 300) {
        setShowWarning(true);
        setTimeLeft(secondsRemaining);
      } 
      // Se o tempo acabou e ele não clicou em nada, o sistema mata a sessão
      else if (secondsRemaining <= 0) {
        setShowWarning(false);
        dispatch(sessionExpired());
      } 
      // Se falta muito tempo, esconde
      else {
        setShowWarning(false);
      }
    };

    // Fica checando o relógio a cada 1 segundo
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [user, isAuthenticated, dispatch]);

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      await dispatch(renewToken()).unwrap();
      setShowWarning(false); // Esconde o modal, o tempo voltou para 1 hora!
    } catch (error) {
      console.error("Falha ao renovar token", error);
      dispatch(sessionExpired());
    } finally {
      setIsRenewing(false);
    }
  };

  // Formata os segundos para MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="h-1.5 w-full bg-amber-500"></div>

        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-amber-50">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-3">
            Sua sessão vai expirar!
          </h2>
          
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Por inatividade, você será desconectado em <span className="font-bold text-amber-600 text-lg">{formatTime(timeLeft)}</span> para proteger seus dados. Deseja continuar trabalhando?
          </p>

          <button
            onClick={handleRenew}
            disabled={isRenewing}
            className="w-full h-11 bg-amber-500 text-white font-bold rounded-md hover:bg-amber-600 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isRenewing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Continuar Conectado'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};