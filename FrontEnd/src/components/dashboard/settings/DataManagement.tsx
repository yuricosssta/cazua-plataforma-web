//src/components/dashboard/settings/DataManagement.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { createPortal } from "react-dom";
import {
  Download, Upload, FileSpreadsheet, CheckCircle2,
  Trash2, AlertTriangle, Save, Loader2, X
} from "lucide-react";
import axiosInstance from "@/lib/api/axiosInstance";
import Papa from 'papaparse';
import { UpgradeModal } from "../UpgradeModal";

interface ImportRow {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  priority: string; // GUT: 1 a 125
  status: string; // DEMAND, PLANNING, EXECUTION, COMPLETED
  isVerified: boolean;
}

export function DataManagement() {
  const currentOrg = useSelector((state: RootState) => state.organizations.currentOrganization);
  const orgId = currentOrg?.organizationId._id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draftRows, setDraftRows] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  useEffect(() => setMounted(true), []);

  // 1. RECUPERAR RASCUNHO SALVO
  useEffect(() => {
    const savedDraft = localStorage.getItem("cazua_import_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.length > 0) {
          setDraftRows(parsed);
          setIsImporting(true);
        }
      } catch (e) {
        console.error("Erro ao ler rascunho", e);
      }
    }
  }, []);

  // 2. SALVAR RASCUNHO A CADA MUDANÇA
  useEffect(() => {
    if (isImporting) {
      localStorage.setItem("cazua_import_draft", JSON.stringify(draftRows));
    }
  }, [draftRows, isImporting]);

  const downloadTemplate = () => {
    const headers = "Titulo;Descricao;Localizacao;DataInicio;DataFim;Prioridade_GUT (1 a 125);Status (1=Demanda, 2=Planej, 3=Exec, 4=Concluido)\n";
    const example = "Reforma do Telhado;Troca das telhas e impermeabilização;Escola XYZ;2026-05-01;2026-05-15;125;1\n";

    const blob = new Blob(["\ufeff" + headers + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cazua_template_importacao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const lines = results.data as string[][];

        const parsedRows: ImportRow[] = lines.slice(1).map((cols, index) => {
          let mappedStatus = "DEMAND";
          const rawStatus = cols[6]?.trim() || "1";
          if (rawStatus === "2" || rawStatus.toUpperCase().includes("PLANEJ")) mappedStatus = "PLANNING";
          if (rawStatus === "3" || rawStatus.toUpperCase().includes("EXEC")) mappedStatus = "EXECUTION";
          if (rawStatus === "4" || rawStatus.toUpperCase().includes("CONCL")) mappedStatus = "COMPLETED";

          return {
            id: `row_${Date.now()}_${index}`,
            title: cols[0]?.trim() || "",
            description: cols[1]?.trim() || "",
            location: cols[2]?.trim() || "",
            startDate: cols[3]?.trim() || "",
            endDate: cols[4]?.trim() || "",
            priority: cols[5]?.trim() || "1",
            status: mappedStatus,
            isVerified: false
          };
        });

        const validRows = parsedRows.filter(r => r.title !== "");
        setDraftRows(validRows);
        setIsImporting(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const updateRow = (index: number, field: keyof ImportRow, value: any) => {
    const newRows = [...draftRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setDraftRows(newRows);
  };

  const toggleVerify = (index: number) => {
    const newRows = [...draftRows];
    newRows[index].isVerified = !newRows[index].isVerified;
    setDraftRows(newRows);
  };

  const cancelImport = () => {
    if (confirm("Descartar importação atual? O rascunho será apagado.")) {
      setDraftRows([]);
      setIsImporting(false);
      localStorage.removeItem("cazua_import_draft");
    }
  };

  const handleFinalSubmit = async () => {
    const unverifiedCount = draftRows.filter(r => !r.isVerified).length;
    if (unverifiedCount > 0) {
      return alert(`Faltam ${unverifiedCount} demanda(s) para conferência.`);
    }

    if (!orgId) return alert("Erro: Organização não identificada.");

    try {
      setIsSubmitting(true);

      await axiosInstance.post(`/organizations/${orgId}/projects/bulk-import`, {
        projects: draftRows
      });

      alert("Demandas importadas com sucesso! Vá para a tela de Projetos para conferir.");
      setDraftRows([]);
      setIsImporting(false);
      setIsModalOpen(false);
      localStorage.removeItem("cazua_import_draft");
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Erro ao salvar no banco de dados.";

      if (errorMsg.includes("LIMITE_FREE_EXCEDIDO")) {
        setUpgradeMessage(errorMsg.replace("LIMITE_FREE_EXCEDIDO:", "").trim());
        setIsUpgradeModalOpen(true);
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const allVerified = draftRows.length > 0 && draftRows.every(r => r.isVerified);

  return (
    <>
      {/* O CARD NA PÁGINA DE CONFIGURAÇÕES */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between border border-border bg-card rounded-sm p-5 shadow-sm gap-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
            Base de Dados
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Importe novas demandas em lote via CSV ou exporte sua base atual.
          </p>
          {isImporting && (
            <p className="text-[10px] font-bold text-amber-600 mt-2 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Rascunho pendente
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-9 px-4 py-2 bg-background border border-border rounded-sm text-sm font-medium hover:bg-muted transition-colors shadow-sm disabled:opacity-50"
            title="Em breve"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
        </div>
      </section>

      {/* MODAL DE IMPORTAÇÃO (GIGANTE) */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-6xl max-h-[90vh] rounded-sm shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Importação em Massa
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-sm text-muted-foreground hover:bg-accent transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/10">
              {!isImporting ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[400px]">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2 border border-primary/20">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold">Faça o upload do seu CSV</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Baixe o modelo com as colunas corretas (GUT e Situação), preencha e envie para iniciar a conferência de dados.
                    </p>
                  </div>

                  {/* AVISO CRÍTICO INJETADO AQUI */}
                  <div className="max-w-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3 rounded-sm text-xs font-medium text-amber-800 dark:text-amber-500 text-left shadow-sm">
                    <strong className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4" /> Importante: Regra de Preenchimento
                    </strong>
                    Nunca utilize o caractere de <strong>ponto e vírgula ( ; )</strong> dentro dos textos de título ou descrição. O sistema utiliza este símbolo para separar as colunas, e o seu uso corromperá a importação.
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button onClick={downloadTemplate} className="h-10 px-4 py-2 border border-border bg-background text-foreground text-sm font-semibold rounded-sm hover:bg-muted transition-colors flex items-center gap-2 shadow-sm">
                      <Download className="w-4 h-4" /> Modelo CSV
                    </button>

                    <button onClick={() => fileInputRef.current?.click()} className="h-10 px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Selecionar Arquivo
                    </button>
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex justify-between items-center text-sm">
                    <span className="font-semibold text-amber-900 dark:text-amber-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Conferência Necessária: {draftRows.length} linhas
                    </span>
                    <span className="text-muted-foreground text-xs font-medium">
                      O rascunho está salvo localmente.
                    </span>
                  </div>

                  <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm text-left whitespace-nowrap border border-border rounded-sm overflow-hidden bg-card">
                      <thead className="bg-muted text-muted-foreground text-[11px] uppercase font-bold border-b border-border tracking-wider">
                        <tr>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Título</th>
                          <th className="px-3 py-3" title="Gravidade, Urgência e Tendência (1 a 125)">Prioridade (1-125)</th>
                          <th className="px-3 py-3 text-center">Conferência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {draftRows.map((row, idx) => (
                          <tr key={row.id} className={`transition-colors ${row.isVerified ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-muted/30'}`}>
                            <td className="px-3 py-2">
                              <select
                                value={row.status}
                                onChange={(e) => updateRow(idx, 'status', e.target.value)}
                                disabled={row.isVerified}
                                className="h-8 rounded-sm border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary disabled:opacity-70 disabled:bg-muted font-semibold"
                              >
                                <option value="DEMAND">Demanda</option>
                                <option value="PLANNING">Planejamento</option>
                                <option value="EXECUTION">Em Execução</option>
                                <option value="COMPLETED">Concluída</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.title}
                                onChange={(e) => updateRow(idx, 'title', e.target.value)}
                                disabled={row.isVerified}
                                className="h-8 w-full min-w-[200px] rounded-sm border-transparent bg-transparent px-2 text-sm hover:border-input focus:border-primary focus:bg-background disabled:opacity-70 transition-all"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1} max={125}
                                value={row.priority}
                                onChange={(e) => updateRow(idx, 'priority', e.target.value)}
                                disabled={row.isVerified}
                                className="h-8 w-20 rounded-sm border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary disabled:opacity-70 disabled:bg-muted"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => toggleVerify(idx)}
                                className={`h-8 px-3 rounded-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-all w-24 mx-auto border ${row.isVerified ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' : 'bg-background text-muted-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary border-border'}`}
                              >
                                {row.isVerified ? <><CheckCircle2 className="w-3.5 h-3.5" /> Ok</> : 'Conferir'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="px-5 py-4 border-t border-border bg-background flex items-center justify-between">
              {isImporting ? (
                <button onClick={cancelImport} className="text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 transition-colors">
                  <Trash2 className="w-4 h-4" /> Descartar Tudo
                </button>
              ) : (
                <div></div> // Spacer
              )}

              <button
                onClick={handleFinalSubmit}
                disabled={(!allVerified && isImporting) || isSubmitting || !isImporting}
                className="h-10 px-6 bg-foreground text-background text-sm font-bold rounded-sm hover:bg-foreground/90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {allVerified ? 'Salvar no Sistema' : isImporting ? 'Verifique todas as linhas' : 'Aguardando Arquivo'}
              </button>
            </div>
          </div>

          <UpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            title="Limite de Demandas Atingido"
            message={upgradeMessage}
          />

        </div>,
        document.body
      )}
    </>
  );
}