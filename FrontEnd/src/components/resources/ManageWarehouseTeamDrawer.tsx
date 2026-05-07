//src/components/resources/ManageWarehouseTeamDrawer.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, UserMinus, Shield, Loader2, Users } from "lucide-react";
import axios from "axios";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { IUser } from "@/types/user";
import { resourceService } from "@/lib/services/resourceService";

interface ManageWarehouseTeamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  currentAssignedMembers: string[];
  orgRole: string;
  onSuccess: () => void;
}

export function ManageWarehouseTeamDrawer({ isOpen, onClose, orgId, currentAssignedMembers, orgRole, onSuccess }: ManageWarehouseTeamDrawerProps) {
  const token = useSelector((state: RootState) => state.auth.token);

  const [orgMembers, setOrgMembers] = useState<IUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgMembers = async () => {
      if (!isOpen || !orgId || !token) return;
      try {
        setIsLoadingMembers(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrgMembers(response.data);
      } catch (error) {
        console.error("Erro ao buscar equipe da empresa:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchOrgMembers();
  }, [isOpen, orgId, token]);

  const handleAssign = async (userId: string) => {
    try {
      setProcessingId(userId);
      await resourceService.assignWarehouseMember(orgId, userId, orgRole);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || "Falha ao alocar o membro.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      setProcessingId(userId);
      await resourceService.removeWarehouseMember(orgId, userId, orgRole);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || "Falha ao remover o membro do almoxarifado.");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-background shadow-2xl border-l border-border transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Equipe do Almoxarifado
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Gerencie quem tem permissão para operar o estoque.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingMembers ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm">Buscando usuários...</p>
            </div>
          ) : orgMembers.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-md border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Nenhum membro encontrado na organização.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orgMembers.map((member) => {
                const isAssigned = currentAssignedMembers.includes(String(member._id || member.id));
                const isProcessing = processingId === String(member._id || member.id);

                return (
                  <div key={member._id} className={`flex items-center justify-between p-3 rounded-md border transition-colors ${isAssigned ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:border-muted-foreground/30'}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm flex-shrink-0 ${isAssigned ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <button
                      disabled={isProcessing}
                      onClick={() => isAssigned ? handleRemove(String(member._id || member.id)) : handleAssign(String(member._id || member.id))}
                      className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors flex-shrink-0 ${isProcessing ? 'bg-muted text-muted-foreground cursor-not-allowed' :
                          isAssigned
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-100'
                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20'
                        }`}
                      title={isAssigned ? "Remover do Almoxarifado" : "Alocar no Almoxarifado"}
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        isAssigned ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-background">
          <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-800 rounded-md border border-blue-100">
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
            <p className="text-xs leading-relaxed">
              Apenas os membros alocados podem registrar entradas, saídas, estornos e aprovar requisições de projetos.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}