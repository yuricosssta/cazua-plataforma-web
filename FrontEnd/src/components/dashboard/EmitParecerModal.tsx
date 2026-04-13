//src/components/dashboard/EmitParecerModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Activity, MessageSquare, ArrowRightCircle, Flame, Navigation, MapPin, Map as MapIcon, Check, Calendar, FileText, Briefcase, Paperclip, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import axiosInstance from "@/lib/api/axiosInstance";
import axios from "axios";
import { Project } from "@/types/project";

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

interface EmitParecerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project | null;
}

export function EmitParecerModal({ isOpen, onClose, onSuccess, project }: EmitParecerModalProps) {
  const currentOrg = useSelector(selectCurrentOrg);

  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  const orgRole = currentOrg?.role || 'MEMBER';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gut, setGut] = useState({ gravidade: 3, urgencia: 3, tendencia: 3 });
  const [parecerText, setParecerText] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updateGUT, setUpdateGUT] = useState(false);

  // ESTADOS DO DESDOBRAMENTO TÉCNICO E GPS
  const [technicalTitle, setTechnicalTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // ESTADOS DE UPLOAD R2
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);

  // RECUPERAÇÃO INICIAL (Status e Rascunho)
  useEffect(() => {
    if (isOpen && project) {
      setNewStatus(project.status);
      
      // Carrega o rascunho específico DESSA obra (caso ele tenha fechado sem querer)
      const draftKey = `draft_parecer_${project.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setParecerText(savedDraft);
      }
    }
  }, [isOpen, project]);

  // SALVAMENTO AUTOMÁTICO (Auto-Save)
  useEffect(() => {
    if (isOpen && project && parecerText.length > 0) {
      const draftKey = `draft_parecer_${project.id}`;
      localStorage.setItem(draftKey, parecerText);
    }
  }, [parecerText, isOpen, project]);


  // OpenLayers Config
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstance.current) {
      vectorSource.current = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource.current,
        style: new Style({
          image: new Icon({ anchor: [0.5, 1], src: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png', scale: 0.06 }),
        }),
      });

      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: new View({ center: fromLonLat([-43.76, -21.22]), zoom: 13 }),
      });

      const latMatch = location.match(/Lat:\s*(-?\d+\.\d+)/);
      const lngMatch = location.match(/Lng:\s*(-?\d+\.\d+)/);
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

        const addressPart = location.split(' | ')[0];
        setLocation(addressPart && !addressPart.startsWith('Lat:') ? `${addressPart} | Lat: ${lat}, Lng: ${lng}` : `Lat: ${lat}, Lng: ${lng}`);
      });
    }

    return () => {
      if (mapInstance.current && !showMap) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, [showMap, location]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Seu navegador não suporta geolocalização.");
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLocation(prev => {
          const addressPart = prev.split(' | ')[0];
          return addressPart && !addressPart.startsWith('Lat:') ? `${addressPart} | Lat: ${lat}, Lng: ${lng}` : `Lat: ${lat}, Lng: ${lng}`;
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Erro de GPS:", error);
        alert("Não foi possível acessar a localização.");
        setIsGettingLocation(false);
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploadingFiles(true);
    try {
      const newAttachmentUrls: string[] = [];

      for (const file of files) {
        const authResponse = await axiosInstance.post('/storage/presigned-url', {
          fileName: file.name,
          fileType: file.type
        });

        const { uploadUrl, fileUrl } = authResponse.data;

        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type }
        });

        newAttachmentUrls.push(fileUrl);
      }

      setAttachments(prev => [...prev, ...newAttachmentUrls]);
    } catch (error) {
      console.error("Erro no upload R2:", error);
      alert("Houve um erro ao subir os arquivos.");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  if (!isOpen || !project) return null;

  const currentScore = gut.gravidade * gut.urgencia * gut.tendencia;
  const isPlanningMode = newStatus === "PLANNING" && project.status === "DEMAND";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return alert("Erro: Organização não identificada.");
    if (!parecerText.trim()) return alert("O texto do parecer é obrigatório.");

    if (isPlanningMode && !technicalTitle.trim()) {
      return alert("Ao aprovar para planejamento, é obrigatório definir o Nome Técnico da Obra.");
    }

    try {
      setIsSubmitting(true);

      const payload: any = { parecerText };

      if (newStatus !== project.status) payload.newStatus = newStatus;
      if (updateGUT) payload.priorityDetails = gut;
      if (location) payload.location = location;
      if (attachments.length > 0) payload.attachments = attachments;

      if (technicalTitle) payload.technicalTitle = technicalTitle;
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;

      await axiosInstance.post(
        `/organizations/${orgId}/projects/${project.id}/parecer`,
        payload,
        { headers: { 'x-org-role': orgRole } }
      );

      // Limpa os estados e DELETA o rascunho após o sucesso
      const draftKey = `draft_parecer_${project.id}`;
      localStorage.removeItem(draftKey);
      
      setParecerText(""); 
      setGut({ gravidade: 3, urgencia: 3, tendencia: 3 });
      setUpdateGUT(false); setLocation(""); setTechnicalTitle(""); setStartDate(""); setEndDate("");
      setAttachments([]); setShowMap(false);
      
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro interno ao emitir o parecer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScoreSelector = ({ label, description, value, onChange }: { label: string, description: string, value: number, onChange: (v: number) => void }) => (
    <div className="space-y-1.0">
      <div className="flex justify-between items-end">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{description}</span>
      </div>
      <div className="flex justify-between gap-1.5">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num} type="button" onClick={() => onChange(num)}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all border ${value === num ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
      <div className={`bg-background w-full h-full md:h-[95vh] rounded-none md:rounded-sm shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 transition-all ${showMap ? 'md:max-w-4xl' : 'md:max-w-7xl'}`}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              {showMap ? <MapIcon className="w-5 h-5 text-primary" /> : <Activity className="w-5 h-5 text-primary" />}
              {showMap ? 'Anexar Coordenadas no Parecer' : 'Parecer Técnico'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px] md:max-w-full">
              Demanda: <span className="font-medium text-foreground">{project.title}</span>
            </p>
          </div>
          <button onClick={() => showMap ? setShowMap(false) : onClose()} className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showMap ? (
          <div className="flex-1 flex flex-col relative bg-muted min-h-[50vh]">
            <div ref={mapRef} className="w-full h-full cursor-crosshair" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur shadow-xl border border-border rounded-lg p-3 flex items-center gap-4 w-11/12 max-w-md">
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-0.5">Coordenada Marcada</span>
                <p className="text-sm font-semibold truncate text-foreground">{location || "Nenhum ponto selecionado"}</p>
              </div>
              <button onClick={() => setShowMap(false)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-primary/90 shadow-sm flex-shrink-0">
                <Check className="w-4 h-4" /> Confirmar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">

              <div className="order-2 md:order-1 w-full md:w-[380px] flex-shrink-0 p-5 md:p-6 border-t md:border-t-0 md:border-r border-border md:overflow-y-auto bg-muted/10 space-y-8">

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-3">
                    <ArrowRightCircle className="w-4 h-4 text-primary" /> Status da Demanda
                  </label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 font-semibold text-foreground shadow-sm">
                    <option value="DEMAND">Demanda</option>
                    <option value="PLANNING">Planejamento</option>
                    <option value="EXECUTION">Em Execução</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="INVALID">Inválida ou Improcedente</option>
                  </select>
                </div>

                {isPlanningMode && (
                  <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 font-medium">
                      Para transferir esta demanda para o Backlog da Engenharia, defina o Escopo Técnico.
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-muted-foreground" /> Nome Técnico do Projeto <span className="text-red-500">*</span>
                      </label>
                      <input type="text" required placeholder="Ex: Reforma Estrutural da Cobertura..." value={technicalTitle} onChange={(e) => setTechnicalTitle(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Início Est.</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-primary text-muted-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fim Est.</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-primary text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-border">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer" checked={updateGUT} onChange={(e) => setUpdateGUT(e.target.checked)} />
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Flame className={`w-4 h-4 ${updateGUT ? 'text-orange-500' : 'text-muted-foreground'}`} /> Alterar Prioridade (GUT)
                    </span>
                  </label>
                  {updateGUT && (
                    <div className="space-y-5 bg-card border border-border rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center pb-2 mb-2 border-b border-dashed border-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Nova prioridade</span>
                        <p className={`text-xl font-black leading-none ${currentScore >= 60 ? 'text-red-500' : 'text-primary'}`}>{currentScore}</p>
                      </div>
                      <ScoreSelector label="Gravidade" description="Danos" value={gut.gravidade} onChange={(v) => setGut({ ...gut, gravidade: v })} />
                      <ScoreSelector label="Urgência" description="Tempo" value={gut.urgencia} onChange={(v) => setGut({ ...gut, urgencia: v })} />
                      <ScoreSelector label="Tendência" description="Piora?" value={gut.tendencia} onChange={(v) => setGut({ ...gut, tendencia: v })} />
                    </div>
                  )}
                </div>

              </div>

              <div className="order-1 md:order-2 flex-1 flex flex-col bg-muted/30 relative">
                <div className="px-5 py-3 border-b border-border bg-background/50 flex flex-wrap gap-2 items-center justify-between text-sm font-medium text-muted-foreground flex-shrink-0">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Laudo / Corpo do Parecer <span className="text-red-500">*</span></span>

                  <div className="flex gap-2 ml-auto">
                    {/* Botão de Anexo */}
                    <label className={`cursor-pointer text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors px-2 py-1.5 rounded border ${isUploadingFiles ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'text-primary hover:text-primary/80 bg-primary/5 border-primary/20'}`}>
                      {isUploadingFiles ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
                      {isUploadingFiles ? 'Enviando...' : 'Anexar'}
                      <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploadingFiles} />
                    </label>

                    <button type="button" onClick={() => setShowMap(true)} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/5 px-2 py-1.5 rounded border border-primary/20">
                      <MapIcon className="w-3 h-3" /> Ver Mapa
                    </button>
                    <button type="button" onClick={handleGetLocation} disabled={isGettingLocation} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-colors bg-primary/5 px-2 py-1.5 rounded border border-primary/20">
                      {isGettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />} Usar GPS
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center w-full">
                  <div className="w-full max-w-[210mm] min-h-[50vh] bg-background border border-border/50 shadow-md rounded-sm flex flex-col overflow-hidden mb-6">
                    {location && (
                      <div className="bg-muted/30 px-6 md:px-12 py-4 border-b border-border flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="w-full">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Localização Anexada ao Parecer</p>
                          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço complementar ou coordenadas" className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none border-b border-dashed border-border pb-1" />
                        </div>
                      </div>
                    )}
                    
                    {/* A CAIXA DE TEXTO SEMPRE RENDERIZA AGORA */}
                    <textarea 
                      required 
                      placeholder="Inicie aqui a redação do seu parecer técnico..." 
                      value={parecerText} 
                      onChange={(e) => setParecerText(e.target.value)} 
                      className="flex-1 w-full h-full resize-none p-6 md:p-12 focus-visible:outline-none text-base leading-relaxed placeholder:text-muted-foreground bg-transparent" 
                    />
                  </div>
                  
                  {/* PREVIEW DOS ANEXOS */}
                  {attachments.length > 0 && (
                    <div className="w-full max-w-[210mm]">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Arquivos Anexados ({attachments.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((url, i) => (
                          <div key={i} className="relative group rounded-md overflow-hidden bg-muted border border-border flex items-center justify-center w-20 h-20">
                            {url.endsWith('.pdf') ? (
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            ) : (
                              <img src={url} alt="Anexo" className="w-full h-full object-cover" />
                            )}
                            <button type="button" onClick={() => removeAttachment(i)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-background flex-shrink-0">
              <button type="button" onClick={onClose} disabled={isSubmitting || isUploadingFiles} className="px-5 py-2.5 text-sm font-medium rounded-md border border-border hover:bg-accent hover:text-foreground transition-colors">Cancelar</button>
              <button type="submit" disabled={isSubmitting || isUploadingFiles} className="px-6 py-2.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
                {(isSubmitting || isUploadingFiles) && <Loader2 className="w-4 h-4 animate-spin" />} Salvar Parecer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}