//src/components/dashboard/settings/LandingPageSettings.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { landingPageService } from "@/lib/services/landingPageService";
import { Save, Loader2, Globe, PaintBucket, FileText, Eye, AlertCircle, CheckCircle2, ExternalLink, Info } from "lucide-react";

const landingPageFormSchema = z.object({
  domain: z.string().optional(),
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

function hslStringToHex(hslString: string): string {
  if (!hslString) return "#000000";
  const parts = hslString.split(' ').map(p => parseFloat(p));
  if (parts.length < 3) return "#000000";
  let [h, s, l] = parts;
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function LandingPageSettings() {
  const currentOrgId = useSelector((state: RootState) => state.organizations.currentOrganization?.organizationId?._id);
  const orgSlug = useSelector((state: RootState) => state.organizations.currentOrganization?.organizationId?.slug);
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'grupocazua.com.br';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
  const currentDomain = watch("domain");

  useEffect(() => {
    async function fetchConfig() {
      if (!currentOrgId) return;
      try {
        const data = await landingPageService.getConfig(currentOrgId);

        setValue("domain", data.domain);
        setValue("name", data.name);
        setValue("heroTitle", data.heroTitle);
        setValue("heroSubtitle", data.heroSubtitle);
        setValue("contentMDX", data.contentMDX || "");
        setValue("isActive", data.isActive);

        if (data.theme && data.theme.primaryHSL) {
          setValue("primaryColorHex", hslStringToHex(data.theme.primaryHSL));
        }
      } catch (error: any) {
        if (!error.message.includes("não encontrada")) {
          setErrorMsg(error.message || "Falha ao carregar configurações do site.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, [currentOrgId, setValue]);

  const onSubmit = async (data: LandingPageFormData) => {
    if (!currentOrgId) return;

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        domain: data.domain?.toLowerCase().trim() || '',
        name: data.name,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        contentMDX: data.contentMDX,
        isActive: data.isActive,
        theme: {
          primaryHSL: hexToHSLString(data.primaryColorHex),
        },
      };

      await landingPageService.upsertConfig(currentOrgId, payload);
      setSuccessMsg(`Configurações publicadas. O site já está acessível em seu domínio configurado.`);
    } catch (error: any) {
      setErrorMsg(error.message || "Erro ao salvar as configurações.");
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

  // Defina aqui o IP ou CNAME do servidor que hospeda o Next.js do Cazuá
  const SERVER_IP = "76.76.21.21"; // Exemplo padrão Vercel. Altere conforme sua infra.

  return (
    <form 
    // onSubmit={handleSubmit(onSubmit)} 
    className="space-y-8">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start justify-between p-3 text-sm bg-primary/10 text-primary border border-primary/20 rounded-md gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {currentDomain && (
              <a
                href={`https://${currentDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-bold underline hover:opacity-80 transition-opacity text-xs"
              >
                Testar Domínio Próprio <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {orgSlug && (
              <a
                href={`https://${orgSlug}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-bold underline hover:opacity-80 transition-opacity text-xs"
              >
                Acessar Subdomínio Cazuá <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
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
          <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border/60 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </section>

      <div className={!isActive ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>

        {/* Domínio e Identidade */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold border-b border-border pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Roteamento e Marca
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Domínio Personalizado</label>
                <input
                  {...register("domain")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lowercase"
                  placeholder="Opcional: ex: construtora.com.br (deixe em branco para usar subdomínio Cazuá)"
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

            {/* Instrução DNS B2B */}
            {currentDomain && currentDomain.length > 3 && (
              <div className="p-4 bg-muted/30 border border-border rounded-md text-xs space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> Configuração de Domínio (DNS)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Para que a landing page fique disponível, acesse o painel do seu provedor de domínio (ex: Registro.br, GoDaddy) e crie os apontamentos abaixo na <strong>Zona de DNS</strong>. A propagação pode levar <strong>até 24 horas</strong>.
                </p>

                <div className="space-y-2">
                  <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">1. Se for usar o domínio principal (ex: {currentDomain.replace('www.', '')}):</p>
                  <div className="grid grid-cols-3 gap-2 font-mono bg-background p-2 rounded-sm border border-border text-center items-center">
                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px] uppercase">Tipo</span><strong>A</strong></div>
                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px] uppercase">Nome</span><strong>@</strong></div>
                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px] uppercase">IPv4</span><strong>76.76.21.21</strong></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">2. Se for usar o subdomínio WWW (ex: www.{currentDomain.replace('www.', '')}):</p>
                  <div className="grid grid-cols-3 gap-2 font-mono bg-background p-2 rounded-sm border border-border text-center items-center">
                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px] uppercase">Tipo</span><strong>CNAME</strong></div>
                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px] uppercase">Nome</span><strong>www</strong></div>
                    <div className="flex flex-col"><span className="text-muted-foreground text-[10px] uppercase">Destino</span><strong>cname.vercel-dns.com</strong></div>
                  </div>
                </div>

                {orgSlug && (
                  <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                    <p className="font-semibold text-xs text-primary flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Acesso Imediato (Subdomínio Cazuá):
                    </p>
                    <a
                      href={`https://${orgSlug}.${rootDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline break-all mt-1 inline-block"
                    >
                      https://{orgSlug}.{rootDomain}
                    </a>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Funciona imediatamente — sem configuração DNS. Compartilhe este link enquanto o domínio próprio propaga.
                    </p>
                  </div>
                )}
              </div>
            )}
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
          // type="submit"
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving || !currentOrgId}
          className="inline-flex items-center justify-center bg-primary text-primary-foreground h-9 px-6 rounded-md text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Configurações
        </button>
      </div>
    </form>
  );
}