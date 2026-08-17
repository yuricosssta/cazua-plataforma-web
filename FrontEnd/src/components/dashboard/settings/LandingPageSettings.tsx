//src/components/dashboard/settings/LandingPageSettings.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Loader2, Globe, PaintBucket, FileText, Eye, AlertCircle } from "lucide-react";

const landingPageFormSchema = z.object({
  domain: z.string().min(3, "Domínio inválido (ex: construtora.com.br)"),
  name: z.string().min(2, "Nome da empresa é obrigatório"),
  heroTitle: z.string().min(5, "Título principal é obrigatório"),
  heroSubtitle: z.string().min(10, "Subtítulo é obrigatório"),
  contentMDX: z.string().optional(),
  primaryColorHex: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Cor inválida"),
  isActive: z.boolean(),
});

type LandingPageFormData = z.infer<typeof landingPageFormSchema>;

function hexToHSLString(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  r /= 255; g /= 255; b /= 255;
  const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  return `${h} ${s}% ${l}%`;
}

export function LandingPageSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LandingPageFormData>({
    resolver: zodResolver(landingPageFormSchema),
    defaultValues: {
      domain: "",
      name: "",
      heroTitle: "",
      heroSubtitle: "",
      contentMDX: "",
      primaryColorHex: "#000000",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    async function fetchConfig() {
      try {
        // Mock payload para renderização inicial
        const mockData = {
          domain: "grupocazua.com.br",
          name: "Costa Marinho Engenharia",
          heroTitle: "Gestão Inteligente de Obras",
          heroSubtitle: "Acompanhamento em tempo real e controle de recursos estruturais.",
          contentMDX: "## Fale com nossos engenheiros\n<LeadCaptureForm buttonText=\"Solicitar Cotação\" />",
          isActive: true,
        };

        setValue("domain", mockData.domain);
        setValue("name", mockData.name);
        setValue("heroTitle", mockData.heroTitle);
        setValue("heroSubtitle", mockData.heroSubtitle);
        setValue("contentMDX", mockData.contentMDX);
        setValue("isActive", mockData.isActive);
        setValue("primaryColorHex", "#3b82f6"); 
      } catch (error) {
        setErrorMsg("Falha ao carregar configurações do site.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, [setValue]);

  const onSubmit = async (data: LandingPageFormData) => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        domain: data.domain,
        name: data.name,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        contentMDX: data.contentMDX,
        isActive: data.isActive,
        theme: {
          primaryHSL: hexToHSLString(data.primaryColorHex),
        },
      };

      console.log("Payload submetido:", payload);
    } catch (error) {
      setErrorMsg("Erro ao salvar as configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Visibilidade Pública */}
      <section className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-md">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" /> Visibilidade do Site
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Habilite ou desabilite o acesso público ao domínio customizado.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" {...register("isActive")} />
          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </section>

      <div className={!isActive ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
        
        {/* Domínio e Identidade */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b border-border pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Roteamento e Marca
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Domínio Personalizado</label>
              <input
                {...register("domain")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="ex: suaempresa.com.br"
              />
              {errors.domain && <span className="text-xs text-destructive">{errors.domain.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Nome de Exibição</label>
              <input
                {...register("name")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="space-y-4 mt-6">
          <h3 className="text-sm font-bold border-b border-border pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Seção Principal (Hero)
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Título de Impacto</label>
              <input
                {...register("heroTitle")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {errors.heroTitle && <span className="text-xs text-destructive">{errors.heroTitle.message}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Subtítulo Descritivo</label>
              <textarea
                {...register("heroSubtitle")}
                rows={2}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              {errors.heroSubtitle && <span className="text-xs text-destructive">{errors.heroSubtitle.message}</span>}
            </div>
          </div>
        </section>

        {/* Tema */}
        <section className="space-y-4 mt-6">
          <h3 className="text-sm font-bold border-b border-border pb-2 flex items-center gap-2">
            <PaintBucket className="w-4 h-4" /> Identidade Visual
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-semibold">Cor Primária (Tema)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register("primaryColorHex")}
                className="h-9 w-16 p-1 rounded-md border border-input bg-transparent cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">Esta cor será aplicada a botões e links principais no seu site.</span>
            </div>
            {errors.primaryColorHex && <span className="text-xs text-destructive">{errors.primaryColorHex.message}</span>}
          </div>
        </section>

        {/* Conteúdo MDX */}
        <section className="space-y-4 mt-6">
          <h3 className="text-sm font-bold border-b border-border pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Corpo da Página (MDX)
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-semibold">Markdown e Componentes Nativos</label>
            <p className="text-xs text-muted-foreground mb-2">
              Utilize Markdown para formatar texto e insira <code>{"<LeadCaptureForm buttonText=\"Enviar\" />"}</code> para injetar seu formulário de contato.
            </p>
            <textarea
              {...register("contentMDX")}
              rows={8}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-muted/10 font-mono px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </section>
      </div>

      <div className="pt-4 flex justify-end border-t border-border mt-8">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center bg-primary text-primary-foreground h-9 px-6 rounded-md text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Configurações
        </button>
      </div>
    </form>
  );
}