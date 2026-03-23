//src/components/dashboard/DashboardMetrics.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Link from "next/link";
import { Plus, HardHat, FileText, CheckCircle, AlertCircle, Activity, Loader2 } from "lucide-react";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { CreateProjectModal } from "./CreateProjectModal";

interface Project {
  id: string;
  status: "DEMAND" | "PLANNING" | "EXECUTION" | "COMPLETED";
  endDate?: string;
  createdAt: string;
  assignedMembers?: any[];
}

export function DashboardMetrics() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  const fetchProjects = async () => {
    if (!orgId || !token) return;
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/projects`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects(response.data);
    } catch (error) {
      console.error("Erro ao buscar projetos para as métricas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [orgId, token]);

  const currentYear = new Date().getFullYear();
  const userId = user?.sub || (user as any)?._id || (user as any)?.id;

  const totalDemandas = projects.length;
  const emPlanejamento = projects.filter(p => p.status === "PLANNING").length;
  const emExecucao = projects.filter(p => p.status === "EXECUTION").length;
  
  const concluidasEsteAno = projects.filter(p => {
    if (p.status !== "COMPLETED") return false;
    const dateToCheck = p.endDate ? new Date(p.endDate) : new Date(p.createdAt);
    return dateToCheck.getFullYear() === currentYear;
  }).length;

  const minhasObras = projects.filter(p => 
    p.assignedMembers?.some((m: any) => {
      const mId = typeof m === 'string' ? m : m._id;
      return mId === userId;
    })
  ).length;

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-card border border-border rounded-xl shadow-sm min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-medium">Calculando indicadores da obra...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Painel Geral
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resumo executivo de todas as demandas e projetos ativos.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm font-semibold text-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        
        <Link href="/dashboard/projects?tab=ALL" className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-primary/50 hover:shadow-md transition-all block group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><FileText className="w-4 h-4" /></div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Total</span>
          </div>
          <div className="text-3xl font-black text-foreground">{totalDemandas}</div>
        </Link>

        <Link href="/dashboard/projects?tab=PLANNING" className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all block group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors"><AlertCircle className="w-4 h-4" /></div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Planejamento</span>
          </div>
          <div className="text-3xl font-black text-foreground">{emPlanejamento}</div>
        </Link>

        <Link href="/dashboard/projects?tab=EXECUTION" className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all block group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors"><HardHat className="w-4 h-4" /></div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Em Execução</span>
          </div>
          <div className="text-3xl font-black text-foreground">{emExecucao}</div>
        </Link>

        <Link href="/dashboard/projects?tab=COMPLETED" className="bg-card border border-border p-4 rounded-xl shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all block group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors"><CheckCircle className="w-4 h-4" /></div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">Concluídas ({currentYear})</span>
          </div>
          <div className="text-3xl font-black text-foreground">{concluidasEsteAno}</div>
        </Link>

        <Link href="/dashboard/projects?tab=MINE" className="bg-card border border-primary/20 p-4 rounded-xl shadow-sm md:col-span-2 flex items-center justify-between relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
          <div className="relative z-10">
            <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Meus Projetos (Alocado)</div>
            <div className="text-sm text-muted-foreground">Projetos onde você faz parte da equipe técnica.</div>
          </div>
          <div className="relative z-10 text-4xl font-black text-primary pr-4 group-hover:scale-110 transition-transform">{minhasObras}</div>
        </Link>

      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchProjects()}
      />
    </div>
  );
}