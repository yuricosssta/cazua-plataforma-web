//src/components/planning/UploadCostsModal.tsx
"use client";

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/redux/store';
import { uploadCostsFile, clearUploadState } from '@/lib/redux/slices/planningSlice';
import { UploadPlanningPayload } from '@/lib/services/planningService';
import { X, ChevronDown, ChevronRight, Download, UploadCloud, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';

interface UploadCostsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadCostsModal = ({ isOpen, onClose }: UploadCostsModalProps) => {
  const dispatch = useDispatch<AppDispatch>();

  // Controle de estado de feedback local para garantir a exibição na UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<UploadPlanningPayload>({
    isGlobal: false,
    state: '',
    referenceMonth: new Date().getMonth() + 1,
    referenceYear: new Date().getFullYear(),
    grupo: '',
  });

  const [showTemplate, setShowTemplate] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleFormChange = (field: keyof UploadPlanningPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadTemplate = () => {
    const csv = `codigoComposicao;custo\n01.001;45.50\n01.002;120.00\n01.003;85.90`;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'template-atualizacao-custos.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: null, message: '' });

    if (!file) {
      setFeedback({ type: 'error', message: 'Por favor, selecione um arquivo de custos.' });
      return;
    }
    if (!formData.state || !formData.grupo) {
      setFeedback({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // O unwrap() garante que o catch capture o erro real do thunk
      await dispatch(uploadCostsFile({ file, metadata: formData })).unwrap();
      setFeedback({ type: 'success', message: 'Custos atualizados com sucesso!' });
      setFile(null); // Limpa o arquivo após sucesso
    } catch (error: any) {
      console.error('Erro na atualização de custos:', error);
      setFeedback({ type: 'error', message: error || 'Ocorreu um erro ao atualizar os custos. Verifique a planilha.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(clearUploadState());
    setFile(null);
    setFeedback({ type: null, message: '' });
    setFormData({
      isGlobal: false,
      state: '',
      referenceMonth: new Date().getMonth() + 1,
      referenceYear: new Date().getFullYear(),
      grupo: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-2xl max-h-[90vh] rounded-lg shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Atualização de Custos em Lote</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="p-6 overflow-y-auto">
          
          {/* Feedbacks de UI dinâmicos (Sucesso / Erro) */}
          {feedback.type === 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-semibold">{feedback.message}</p>
            </div>
          )}

          {feedback.type === 'error' && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-semibold">{feedback.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seção de Template */}
            <div className="bg-muted/30 p-4 rounded-md border border-border">
              <button
                type="button"
                onClick={() => setShowTemplate(!showTemplate)}
                className="text-sm font-semibold text-[#8B4513] dark:text-[#A0522D] hover:opacity-80 flex items-center gap-2 transition-opacity"
              >
                {showTemplate ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Modelo de Planilha de Custos
              </button>
              
              {showTemplate && (
                <div className="mt-4 space-y-3 animate-in slide-in-from-top-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A planilha de atualização exige apenas duas colunas: <strong>codigoComposicao</strong> e <strong>custo</strong>. Baixe o modelo abaixo:
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="h-8 px-3 bg-secondary text-secondary-foreground border border-border rounded-md text-xs font-bold hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Template (.csv)
                  </button>
                </div>
              )}
            </div>

            {/* Tipo de Base */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Tipo de Base de Dados Alvo
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="isGlobalCosts"
                    checked={formData.isGlobal === true}
                    onChange={() => handleFormChange('isGlobal', true)}
                    className="w-4 h-4 text-[#8B4513] border-input focus:ring-[#8B4513]/50"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Global (SINAPI)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="isGlobalCosts"
                    checked={formData.isGlobal === false}
                    onChange={() => handleFormChange('isGlobal', false)}
                    className="w-4 h-4 text-[#8B4513] border-input focus:ring-[#8B4513]/50"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Organização (Customizada)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Estado (UF) <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8B4513]"
                  required
                >
                  <option value="">Selecione</option>
                  {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Grupo de Serviço <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.grupo}
                  onChange={(e) => handleFormChange('grupo', e.target.value)}
                  placeholder="Ex: SERVIÇOS"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8B4513]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Mês de Referência</label>
                <select
                  value={formData.referenceMonth}
                  onChange={(e) => handleFormChange('referenceMonth', parseInt(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8B4513]"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>{month.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Ano de Referência</label>
                <input
                  type="number"
                  value={formData.referenceYear}
                  onChange={(e) => handleFormChange('referenceYear', parseInt(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8B4513]"
                  min="2020" max="2099"
                />
              </div>
            </div>

            {/* Upload Box Corrigido para Tema Escuro */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Arquivo de Custos (.xlsx ou .csv) <span className="text-destructive">*</span>
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".xlsx,.csv,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                />
                <div className={`flex items-center justify-center border-2 border-dashed rounded-md p-6 transition-colors ${file ? 'border-[#8B4513] bg-[#8B4513]/5' : 'border-border bg-muted/20 group-hover:bg-muted/40 group-hover:border-[#8B4513]/50'}`}>
                  <div className="text-center">
                    {file ? (
                      <div className="flex flex-col items-center">
                        <DollarSign className="w-8 h-8 text-[#8B4513] dark:text-[#A0522D] mb-2" />
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB - Clique ou arraste para alterar</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <UploadCloud className="w-8 h-8 mb-2 opacity-80" />
                        <p className="text-sm font-semibold text-foreground">Selecione o arquivo de custos</p>
                        <p className="text-xs mt-1">ou arraste e solte aqui</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Botões */}
            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-9 px-4 bg-transparent border border-border text-foreground hover:bg-muted rounded-md text-sm font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="h-9 px-4 bg-[#8B4513] text-white rounded-md text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando Arquivo...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Atualizar Custos
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};