//src/components/dashboard/CreateProjectModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, MapPin, AlignLeft, Calendar, Navigation, FileText, Map as MapIcon, Check, Link as LinkIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import axiosInstance from "@/lib/api/axiosInstance";
import { UpgradeModal } from "./UpgradeModal";

// Importações do OpenLayers
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";


interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const currentOrg = useSelector(selectCurrentOrg);
  // const token = useSelector((state: RootState) => state.auth.token);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false); // Controla a alternância de telas

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    attachments: "",
  });

  // Inicialização do OpenLayers (Roda apenas quando showMap for true)
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstance.current) {
      vectorSource.current = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource.current,
        style: new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
            scale: 0.06,
          }),
        }),
      });

      const initialCenter = fromLonLat(process.env.NEXT_PUBLIC_INITIAL_MAP_CENTER?.split(',').map(Number) || [-43.7, -21.2]); // Barbacena-MG
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: new View({
          center: initialCenter,
          zoom: 11,
        }),
      });

      // Se já tiver uma coordenada no input, tenta centralizar o mapa nela por pino
      const latMatch = formData.location.match(/Lat:\s*(-?\d+\.\d+)/);
      const lngMatch = formData.location.match(/Lng:\s*(-?\d+\.\d+)/);
      if (latMatch && lngMatch) {
        const coords = fromLonLat([parseFloat(lngMatch[1]), parseFloat(latMatch[1])]);
        mapInstance.current.getView().setCenter(coords);
        mapInstance.current.getView().setZoom(16);
        vectorSource.current.addFeature(new Feature({ geometry: new Point(coords) }));
      }

      mapInstance.current.on('click', (event) => {
        const coords = toLonLat(event.coordinate);
        const lat = coords[1].toFixed(6);
        const lng = coords[0].toFixed(6);

        vectorSource.current?.clear();
        vectorSource.current?.addFeature(new Feature({ geometry: new Point(event.coordinate) }));

        setFormData(prev => {
          const addressPart = prev.location.split(' | ')[0];
          return {
            ...prev,
            location: addressPart && !addressPart.startsWith('Lat:')
              ? `${addressPart} | Lat: ${lat}, Lng: ${lng}`
              : `Lat: ${lat}, Lng: ${lng}`
          }
        });
      });
    }

    return () => {
      if (mapInstance.current && !showMap) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, [showMap]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Seu navegador não suporta geolocalização.");
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setFormData(prev => ({ ...prev, location: `Lat: ${lat}, Lng: ${lng}` }));
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Erro de GPS:", error);
        alert("Não foi possível acessar a localização.");
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return alert("Erro: Organização não identificada.");

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        ...(formData.attachments && { attachments: [formData.attachments] }),
        ...(formData.startDate && { startDate: formData.startDate }),
        ...(formData.endDate && { endDate: formData.endDate }),
      };

      await axiosInstance.post(
        `/organizations/${orgId}/projects`,
        payload
      );

      setFormData({ title: "", description: "", location: "", startDate: "", endDate: "", attachments: "" });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || "Erro interno ao registrar a demanda.";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6">
      <div className={`bg-background w-full rounded-sm shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden transition-all ${showMap ? 'max-w-5xl h-[95vh]' : 'max-w-5xl max-h-[95vh]'}`}>

        {/* Cabeçalho Dinâmico */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {showMap ? 'Selecionar Local no Mapa' : 'Nova Demanda'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {showMap ? 'Clique no local exato do terreno ou obra.' : 'Registre o escopo inicial para avaliação.'}
            </p>
          </div>
          <button onClick={() => showMap ? setShowMap(false) : onClose()} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODO MAPA */}
        {showMap ? (
          <div className="flex-1 flex flex-col relative bg-muted">
            <div ref={mapRef} className="w-full h-full cursor-crosshair" />

            {/* Overlay com a coordenada selecionada e botão Confirmar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur shadow-xl border border-border rounded-lg p-3 flex items-center gap-4 w-11/12 max-w-md">
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-0.5">Coordenada Marcada</span>
                <p className="text-sm font-semibold truncate text-foreground">{formData.location || "Nenhum ponto selecionado"}</p>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm flex-shrink-0"
              >
                <Check className="w-4 h-4" /> Confirmar
              </button>
            </div>
          </div>
        ) : (
          /* MODO FORMULÁRIO */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-muted-foreground" />
                Título da Demanda <span className="text-red-500">*</span>
              </label>
              <input type="text" required placeholder="Ex: Infiltração na Escola Municipal" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Descrição Breve <span className="text-red-500">*</span>
              </label>
              <textarea required rows={3} placeholder="Descreva o problema estrutural de forma sucinta..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />
            </div>

            {/* ANEXOS (LINK) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                Pasta de Anexos (link)
              </label>
              <input
                type="url"
                placeholder="Cole aqui o link com as fotos do problema..."
                value={formData.attachments}
                onChange={(e) => setFormData({ ...formData, attachments: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  Localização <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowMap(true)} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/5 px-2 py-1 rounded border border-primary/20">
                    <MapIcon className="w-3 h-3" /> Mapa Interativo
                  </button>
                  <button type="button" onClick={handleGetLocation} disabled={isGettingLocation} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/5 px-2 py-1 rounded border border-primary/20">
                    {isGettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />} GPS
                  </button>
                </div>
              </div>
              <input type="text" required placeholder="Digite o endereço ou use os botões acima..." value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Início Estimado</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fim Estimado</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium rounded-md border border-transparent hover:bg-accent transition-colors disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 shadow-sm">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Salvar Demanda
              </button>
            </div>
          </form>
        )}
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Limite de Demandas Atingido"
        message={upgradeMessage}
      />

    </div>
  );
}