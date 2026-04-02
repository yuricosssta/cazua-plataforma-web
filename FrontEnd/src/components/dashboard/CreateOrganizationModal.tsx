//src/components/dashboard/CreateOrganizationModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Building2, Tag, AlertTriangle } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/lib/redux/store";
import { fetchMyOrganizations } from "@/lib/redux/slices/organizationSlice";
import { apiCreateOrganization } from "@/lib/api/organizationService";
import { UpgradeModal } from "./UpgradeModal";

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceOnboarding?: boolean; // Indica se é o fluxo obrigatório
}

export function CreateOrganizationModal({ isOpen, onClose, forceOnboarding = false }: CreateOrganizationModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("Usuário não autenticado.");

    if (acronym.length < 2) {
      return alert("A sigla precisa ter pelo menos 2 letras.");
    }

    try {
      setIsSubmitting(true);
      await apiCreateOrganization(token, name, acronym);
      dispatch(fetchMyOrganizations());
      setName("");
      setAcronym("");
      onClose(); 
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || error.response?.data?.message || "Erro interno ao registrar a empresa.";
      if (errorMsg.includes("LIMITE_FREE_EXCEDIDO") || errorMsg.includes("limite")) {
        setUpgradeMessage(errorMsg.replace("LIMITE_FREE_EXCEDIDO:", "").trim());
        setIsUpgradeModalOpen(true);
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-background w-full max-w-md rounded-sm shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">

        {/*  Aviso de Onboarding Obrigatório --> */}
        {forceOnboarding && (
          <div className="bg-amber-500 text-amber-950 px-5 py-3 text-xs font-bold flex items-center gap-2 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4" /> Bem-vindo! Crie sua primeira empresa para continuar.
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {forceOnboarding ? "Sua Primeira Construtora" : "Nova Empresa"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crie um ambiente isolado para gestão de projetos.
            </p>
          </div>
          
          {/* Só mostra o botão de fechar se NÃO for onboarding obrigatório */}
          {!forceOnboarding && (
            <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Nome da Empresa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              placeholder="Ex: Construtora Cazuá"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Sigla de Rastreio (Ticker) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={4}
              placeholder="Ex: CAZ, MRV, VALE..."
              value={acronym}
              onChange={(e) => setAcronym(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono font-bold text-primary focus-visible:ring-2 focus-visible:ring-primary uppercase tracking-widest placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground shadow-sm"
            />
            <p className="text-[11px] text-muted-foreground pt-1">
              Esta sigla (2 a 4 letras) será o prefixo de todas as suas Demandas e Relatórios. Ex: <strong>{acronym || 'CAZ'}.202603.0001</strong>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 mt-2 border-t border-border">
            {/* Só mostra o botão Cancelar se NÃO for onboarding */}
            {!forceOnboarding && (
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50">
                Cancelar
              </button>
            )}
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-4 py-2 text-sm font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Ambiente
            </button>
          </div>
        </form>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Limite de Empresas Atingido"
        message={upgradeMessage}
      />

    </div>,
    document.body
  );
}