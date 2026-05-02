// src/components/dashboard/settings/BrandingSettings.tsx
"use client";

import React, { useState } from "react";
import { UploadCloud, Loader2, CheckCircle } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import axiosInstance from "@/lib/api/axiosInstance";
import { updateCurrentOrgSettings } from "@/lib/redux/slices/organizationSlice";
import { uploadFileToR2 } from "@/lib/services/storageService"; // IMPORT NOVO

export function BrandingSettings() {
  const dispatch = useDispatch();
  const currentMembership = useSelector((state: RootState) => state.organizations.currentOrganization);
  
  const orgId = currentMembership?.organizationId?._id;
  const orgSettings = currentMembership?.organizationId?.settings || {};
  
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [successMsg, setSuccessMsg] = useState("");

  const [images, setImages] = useState({
    logoUrl: orgSettings.logoUrl || "",
    headerUrl: orgSettings.headerUrl || "",
    footerUrl: orgSettings.footerUrl || "",
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'headerUrl' | 'footerUrl') => {
    const file = event.target.files?.[0];
    if (!file || !orgId) return;

    try {
      setIsLoading(prev => ({ ...prev, [fieldName]: true }));
      setSuccessMsg("");

      // CHAMA O SERVIÇO CENTRALIZADO
      const fileUrl = await uploadFileToR2(file);

      const updatedSettings = {
        ...images,
        [fieldName]: fileUrl
      };

      await axiosInstance.patch(`/organizations/${orgId}/settings`, {
        settings: updatedSettings
      });

      setImages(updatedSettings);
      dispatch(updateCurrentOrgSettings(updatedSettings));
      
      setSuccessMsg("Imagem atualizada com sucesso no servidor!");

    } catch (error: any) {
      // Exibe o alerta do bloqueio de 500MB direto na tela
      alert(error.message || "Falha ao fazer upload da imagem.");
    } finally {
      setIsLoading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const renderUploadBox = (title: string, description: string, fieldName: 'logoUrl' | 'headerUrl' | 'footerUrl', aspectRatio: string) => {
    const currentImage = images[fieldName];
    const loading = isLoading[fieldName];

    return (
      <div className="flex flex-col gap-3 p-5 border border-border rounded-md bg-card shadow-sm">
        <div>
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className={`relative flex flex-col items-center justify-center w-full bg-muted/30 border-2 border-dashed border-border rounded-md overflow-hidden transition-colors hover:bg-muted/50 ${aspectRatio}`}>
          
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-xs font-semibold text-muted-foreground">Enviando ...</span>
            </div>
          ) : currentImage ? (
            <>
              <img src={currentImage} alt={title} className="w-full h-full object-contain p-2" />
              <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <label className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md shadow-md">
                  Trocar Imagem
                  <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => handleFileUpload(e, fieldName)} />
                </label>
              </div>
            </>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-4 text-center">
              <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm font-semibold text-primary">Clique para anexar</span>
              <span className="text-xs text-muted-foreground mt-1">PNG ou JPG (Máx. 2MB)</span>
              <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => handleFileUpload(e, fieldName)} />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl w-full flex flex-col gap-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Identidade Visual (Papel Timbrado)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize a logomarca e o papel timbrado que serão utilizados na emissão de laudos e pareceres técnicos em PDF.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-sm font-semibold animate-in fade-in zoom-in-95 duration-300">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderUploadBox("Logomarca Oficial", "Utilizada no cabeçalho dos sistemas e relatórios quando o papel timbrado não for configurado.", "logoUrl", "aspect-video max-h-48")}
        {renderUploadBox("Cabeçalho do Relatório (Header)", "Imagem panorâmica que ocupará o topo da folha A4. Recomendado: 2480 x 350 pixels.", "headerUrl", "aspect-[6/1] max-h-32")}
        
        <div className="md:col-span-2">
          {renderUploadBox("Rodapé do Relatório (Footer)", "Imagem panorâmica que ocupará a base da folha A4. Recomendado: 2480 x 250 pixels.", "footerUrl", "aspect-[8/1] max-h-24")}
        </div>
      </div>
    </div>
  );
}