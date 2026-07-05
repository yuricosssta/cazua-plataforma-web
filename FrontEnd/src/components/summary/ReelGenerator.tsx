//src/components/summary/ReelGenerator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Wand2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createRellSchema, CreateRellDto } from '@/validations/summary.zod';
import { summaryService } from '@/lib/services/summaryService';

const LOCAL_STORAGE_FORM_KEY = 'cazua_reel_form_draft';
const LOCAL_STORAGE_RESULT_KEY = 'cazua_reel_result_draft';

export default function ReelGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<CreateRellDto>({
    resolver: zodResolver(createRellSchema),
    defaultValues: {
      tema: '',
      publico_alvo: '',
      conteudo_tipo: '',
      linha_editorial: '',
      objetivo: '',
      duracao: '',
      tom_voz: '',
      saida: '',
      rascunho: '',
    },
  });

  // Hidratação inicial do Local Storage (prevenindo erro de hidratação do Next.js)
  useEffect(() => {
    setIsMounted(true);
    const savedForm = localStorage.getItem(LOCAL_STORAGE_FORM_KEY);
    const savedResult = localStorage.getItem(LOCAL_STORAGE_RESULT_KEY);

    if (savedForm) {
      form.reset(JSON.parse(savedForm));
    }
    if (savedResult) {
      setGeneratedContent(savedResult);
    }
  }, [form]);

  // Listener persistente para o formulário
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(LOCAL_STORAGE_FORM_KEY, JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Listener persistente para o resultado gerado
  useEffect(() => {
    if (generatedContent !== null) {
      localStorage.setItem(LOCAL_STORAGE_RESULT_KEY, generatedContent);
    }
  }, [generatedContent]);

  const onSubmit = async (data: CreateRellDto) => {
    setIsGenerating(true);
    toast.info('Iniciando geração do roteiro com IA...', { duration: 3000 });

    try {
      const result = await summaryService.generateReel(data);
      setGeneratedContent(result);
      toast.success('Roteiro gerado com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Falha na comunicação com o servidor de borda.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    toast.success('Rascunho encaminhado para aprovação final.');
    // Inserir dispatch do Redux ou chamada de Service para endpoint de persistência real
    console.log('Payload de salvamento:', { ...form.getValues(), result: generatedContent });
  };

  const handleClearDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_FORM_KEY);
    localStorage.removeItem(LOCAL_STORAGE_RESULT_KEY);
    form.reset();
    setGeneratedContent(null);
    toast.success('Rascunhos locais removidos.');
  };

  if (!isMounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Coluna 1: Formulário de Entrada */}
      <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Setup de Conteúdo (IA)</h2>
            <p className="text-sm text-muted-foreground">Defina os parâmetros B2B para geração.</p>
          </div>
          <button 
            type="button" 
            onClick={handleClearDraft}
            className="text-muted-foreground hover:text-destructive transition-colors p-2"
            title="Limpar Rascunhos"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tema</label>
              <input
                {...form.register('tema')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.tema && <p className="text-xs text-destructive">{form.formState.errors.tema.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Público-Alvo</label>
              <input
                {...form.register('publico_alvo')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.publico_alvo && <p className="text-xs text-destructive">{form.formState.errors.publico_alvo.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tipo de Conteúdo</label>
              <input
                {...form.register('conteudo_tipo')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.conteudo_tipo && <p className="text-xs text-destructive">{form.formState.errors.conteudo_tipo.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Linha Editorial</label>
              <input
                {...form.register('linha_editorial')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.linha_editorial && <p className="text-xs text-destructive">{form.formState.errors.linha_editorial.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Objetivo</label>
              <input
                {...form.register('objetivo')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.objetivo && <p className="text-xs text-destructive">{form.formState.errors.objetivo.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Duração</label>
              <input
                {...form.register('duracao')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.duracao && <p className="text-xs text-destructive">{form.formState.errors.duracao.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tom de Voz</label>
              <input
                {...form.register('tom_voz')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.tom_voz && <p className="text-xs text-destructive">{form.formState.errors.tom_voz.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Saída Desejada</label>
              <input
                {...form.register('saida')}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {form.formState.errors.saida && <p className="text-xs text-destructive">{form.formState.errors.saida.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Rascunho Base / Ideias</label>
            <textarea
              {...form.register('rascunho')}
              className="w-full min-h-[100px] px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            {form.formState.errors.rascunho && <p className="text-xs text-destructive">{form.formState.errors.rascunho.message}</p>}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center justify-center h-10 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
              ) : (
                <><Wand2 className="mr-2 h-4 w-4" /> Gerar Roteiro</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Coluna 2: Resultado e Edição */}
      <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm p-6 flex flex-col h-full min-h-[500px]">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Roteiro Gerado</h2>
          <p className="text-sm text-muted-foreground">Verifique e ajuste o retorno da IA.</p>
        </div>

        <div className="flex-1 flex flex-col">
          <textarea
            value={generatedContent || ''}
            onChange={(e) => setGeneratedContent(e.target.value)}
            disabled={!generatedContent && !isGenerating}
            placeholder={isGenerating ? 'A IA está escrevendo...' : 'Aguardando submissão.'}
            className="flex-1 w-full p-4 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSaveDraft}
            disabled={!generatedContent || isGenerating}
            className="inline-flex items-center justify-center h-10 px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-md border border-border hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="mr-2 h-4 w-4" />
            Aprovar Roteiro
          </button>
        </div>
      </div>
    </div>
  );
}