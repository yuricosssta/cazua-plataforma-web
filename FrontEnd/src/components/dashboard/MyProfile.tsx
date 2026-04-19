//src/components/dashboard/MyProfile.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { User, Lock, Save, Loader2, Mail, ShieldCheck } from "lucide-react";
import { RootState, AppDispatch } from "@/lib/redux/store";
import { fetchUserProfile } from "@/lib/redux/slices/userSlice";
import { apiUpdateProfile, apiChangePassword } from "@/lib/services/userService";

export function MyProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, status } = useSelector((state: RootState) => state.user);

  const [name, setName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  useEffect(() => {
    if (!profile && status !== 'loading') dispatch(fetchUserProfile());
  }, [profile, status, dispatch]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !name.trim()) return;

    const targetId = profile._id || (profile as any).id;
    if (!targetId) return alert("Erro de sessão: ID do usuário não encontrado na memória.");

    try {
      setIsUpdatingName(true);
      setNameSuccess(false);

      await apiUpdateProfile(targetId, name);

      dispatch(fetchUserProfile());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || "Erro ao atualizar nome.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess(false);

    if (passwords.new.length < 6) return setPassError("A nova senha deve ter pelo menos 6 caracteres.");
    if (passwords.new !== passwords.confirm) return setPassError("As senhas não coincidem.");

    try {
      setIsUpdatingPassword(true);
      
      await apiChangePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new
      });

      setPassSuccess(true);
      setPasswords({ current: "", new: "", confirm: "" });
      setTimeout(() => setPassSuccess(false), 4000);
    } catch (error: any) {
      setPassError(error.message || "Erro ao alterar a senha. Verifique sua senha atual.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const userName = profile?.name || "";
  const userAvatar = profile?.avatarUrl || "";

  if (status === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col space-y-10 text-foreground pb-10">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gerencie sua identidade global. Estas informações se aplicam a todas as construtoras que você tem acesso.
        </p>
      </div>

      <div className="flex flex-col space-y-10">
        {/* Avatar */}
        <section className="flex items-center justify-between border-b border-border pb-8">
          <div>
            <h3 className="text-sm font-semibold">Imagem do Perfil</h3>
            <p className="text-xs text-muted-foreground mt-1">Faça upload da sua própria imagem como avatar (Em breve)</p>
          </div>
          <button className="flex items-center justify-center w-14 h-14 rounded-full bg-accent border border-border overflow-hidden shadow-sm">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-accent-foreground uppercase">{userName.charAt(0)}</span>
            )}
          </button>
        </section>

        {/* E-mail */}
        <section className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-border pb-8 gap-4">
          <div className="sm:w-1/3">
            <h3 className="text-sm font-semibold flex items-center gap-2">E-mail de Acesso <ShieldCheck className="w-4 h-4 text-emerald-500" /></h3>
            <p className="text-xs text-muted-foreground mt-1">Seu e-mail é a chave global e não pode ser alterado por aqui.</p>
          </div>
          <div className="sm:w-2/3 max-w-sm w-full">
            <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground shadow-sm items-center gap-2 cursor-not-allowed">
              <Mail className="w-4 h-4" /> {profile?.email}
            </div>
          </div>
        </section>

        {/* Nome */}
        <section className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-border pb-8 gap-4">
          <div className="sm:w-1/3">
            <h3 className="text-sm font-semibold">Nome de exibição</h3>
            <p className="text-xs text-muted-foreground mt-1">Como você aparece nos Diários de Obra e Pareceres.</p>
          </div>
          <div className="sm:w-2/3 max-w-sm w-full">
            <form onSubmit={handleUpdateName} className="space-y-3">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm transition-all" />
              <div className="flex items-center gap-3">
                <button type="submit" disabled={isUpdatingName || name === profile?.name} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {isUpdatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Nome
                </button>
                {nameSuccess && <span className="text-xs font-bold text-emerald-500 animate-in fade-in">Atualizado!</span>}
              </div>
            </form>
          </div>
        </section>

        {/* Senha */}
        <section className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 gap-4">
          <div className="sm:w-1/3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-muted-foreground" /> Segurança</h3>
            <p className="text-xs text-muted-foreground mt-1">Mantenha sua conta segura utilizando senhas fortes.</p>
          </div>
          <div className="sm:w-2/3 max-w-sm w-full">
            <form onSubmit={handleUpdatePassword} className="space-y-4 bg-muted/30 p-5 rounded-lg border border-border/50">
              {passError && <div className="p-2 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-200">{passError}</div>}
              {passSuccess && <div className="p-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded border border-emerald-200">Senha alterada com sucesso!</div>}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Senha Atual</label>
                <input type="password" required value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Nova Senha</label>
                  <input type="password" required minLength={6} value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Confirmar</label>
                  <input type="password" required value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm" />
                </div>
              </div>

              <button type="submit" disabled={isUpdatingPassword || !passwords.current || !passwords.new} className="w-full h-9 bg-foreground text-background text-sm font-bold rounded-md hover:bg-foreground/90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar Senha'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}