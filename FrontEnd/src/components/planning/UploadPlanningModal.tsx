//src/components/planning/UploadPlanningModal.tsx
"use client";

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/redux/store';
import { uploadExcelFile, clearUploadState } from '@/lib/redux/slices/planningSlice';
import { UploadPlanningPayload } from '@/lib/services/planningService';
import { X, ChevronDown, ChevronRight, Download, UploadCloud, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface UploadPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadPlanningModal = ({ isOpen, onClose }: UploadPlanningModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { uploadLoading, uploadError, uploadSuccess } = useSelector((state: RootState) => state.planning);

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
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleFormChange = (field: keyof UploadPlanningPayload, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownloadTemplate = () => {
    const csv = `codigoComposicao,tipo,insumo,descricao,unidade,coeficiente,custo\n01.001,,,"Mão de obra - Pedreiro",h,1.0,45.50\n01.001,INSUMO,,"Cimento Portland CP II - 50kg",saco,0.5,25.00\n01.001,INSUMO,,"Areia média",m³,0.3,120.00`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'template-planning.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Por favor, selecione um arquivo.');
      return;
    }

    if (!formData.state || !formData.grupo) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await dispatch(uploadExcelFile({ file, metadata: formData })).unwrap();
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };

  const handleClose = () => {
    dispatch(clearUploadState());
    setFile(null);
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
      <div className="bg-background w-full max-w-2xl max-h-[90vh] rounded-md shadow-2xl border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-bold tracking-tight text-foreground">Upload de Composições</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="p-6 overflow-y-auto">
          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-3 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-medium">Upload realizado com sucesso!</p>
            </div>
          )}

          {uploadError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{uploadError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Seção de Template */}
            <div className="bg-muted/30 p-4 rounded-md border border-border">
              <button
                type="button"
                onClick={() => setShowTemplate(!showTemplate)}
                className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-2 transition-colors"
              >
                {showTemplate ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                Modelo de Planilha Padrão
              </button>
              
              {showTemplate && (
                <div className="mt-4 space-y-3 animate-in slide-in-from-top-1">
                  <p className="text-xs text-muted-foreground">
                    Baixe o modelo de planilha estruturado para orientar a importação de dados para o sistema:
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="h-8 px-3 bg-secondary text-secondary-foreground border border-border rounded-sm text-xs font-bold hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Template (.csv)
                  </button>
                </div>
              )}
            </div>

            {/* Tipo de Base */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Tipo de Base de Dados
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="isGlobal"
                    checked={formData.isGlobal === true}
                    onChange={() => handleFormChange('isGlobal', true)}
                    className="w-4 h-4 text-primary border-input focus:ring-primary/50"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Global (SINAPI)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="isGlobal"
                    checked={formData.isGlobal === false}
                    onChange={() => handleFormChange('isGlobal', false)}
                    className="w-4 h-4 text-primary border-input focus:ring-primary/50"
                  />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Organização (Customizada)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Estado (UF) <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Selecione um estado</option>
                  {[
                    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
                  ].map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Grupo */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Grupo de Serviço <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.grupo}
                  onChange={(e) => handleFormChange('grupo', e.target.value)}
                  placeholder="Ex: SERVIÇOS, MATERIAIS"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                />
              </div>
            </div>

            {/* Período de Referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Mês de Referência
                </label>
                <select
                  value={formData.referenceMonth}
                  onChange={(e) => handleFormChange('referenceMonth', parseInt(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Ano de Referência
                </label>
                <input
                  type="number"
                  value={formData.referenceYear}
                  onChange={(e) => handleFormChange('referenceYear', parseInt(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  min="2020"
                  max="2099"
                />
              </div>
            </div>

            {/* Upload de Arquivo Customizado */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Arquivo (.xlsx ou .csv) <span className="text-destructive">*</span>
              </label>
              
              <div className="relative group">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.csv,.xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                />
                <div className={`flex items-center justify-center border-2 border-dashed rounded-md p-6 transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 group-hover:bg-muted/40 group-hover:border-primary/50'}`}>
                  <div className="text-center">
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileSpreadsheet className="w-8 h-8 text-primary mb-2" />
                        <p className="text-sm font-semibold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Clique ou arraste para alterar</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <UploadCloud className="w-8 h-8 mb-2 opacity-80" />
                        <p className="text-sm font-semibold text-foreground">Selecione um arquivo</p>
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
                className="h-9 px-4 bg-transparent border border-border text-foreground hover:bg-muted rounded-sm text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploadLoading}
                className="h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Enviar Dados
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