//src/components/dashboard/EmitParecerModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Activity, ArrowRightCircle, Flame, Navigation, MapPin, Map as MapIcon, Check, Calendar, Briefcase, Paperclip, Trash2, FileText } from "lucide-react";
import { useSelector } from "react-redux";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import { Project, ProjectStatus } from "@/types/project";
import { uploadFileToR2 } from "@/lib/services/storageService";
import { emitParecer } from "@/lib/services/projectService";

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

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "DEMAND", label: "Demanda" },
  { value: "PLANNING", label: "Planejamento" },
  { value: "EXECUTION", label: "Em Execução" },
  { value: "ON_HOLD", label: "Paralisada" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "INVALID", label: "Inválida ou Improcedente" },
];

export function EmitParecerModal({ isOpen, onClose, onSuccess, project }: EmitParecerModalProps) {
  const currentOrg = useSelector(selectCurrentOrg);

  const orgId = typeof currentOrg?.organizationId === "object"
    ? (currentOrg.organizationId as any)._id
    : currentOrg?.organizationId;

  const orgRole = currentOrg?.role || 'MEMBER';
  
  const projectId = project?.id || (project as any)?._id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gut, setGut] = useState({ gravidade: 3, urgencia: 3, tendencia: 3 });
  const [parecerText, setParecerText] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [updateGUT, setUpdateGUT] = useState(false);

  const [technicalTitle, setTechnicalTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);

  useEffect(() => {
    if (isOpen && project && projectId) {
      setNewStatus(project.status);

      const draftKey = `draft_parecer_${projectId}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setParecerText(parsed.text || "");
          if (parsed.attachments && Array.isArray(parsed.attachments)) {
            setAttachments(parsed.attachments);
          }
        } catch (e) {
          setParecerText(savedDraft);
        }
      }
    }
  }, [isOpen, project, projectId]);

  useEffect(() => {
    if (isOpen && projectId && (parecerText.length > 0 || attachments.length > 0)) {
      const draftKey = `draft_parecer_${projectId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        text: parecerText,
        attachments: attachments
      }));
    }
  }, [parecerText, attachments, isOpen, projectId]);

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

      const latMatch = location.match(/Lat:\s*(-?\d+\.\d+)/) || location.match(/\s*(-?\d+\.\d+,)/);
      const lngMatch = location.match(/Lng:\s*(-?\d+\.\d+)/) || location.match(/,\s*(-?\d+\.\d+)/);

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
        const fileUrl = await uploadFileToR2(file);
        newAttachmentUrls.push(fileUrl);
      }

      setAttachments(prev => [...prev, ...newAttachmentUrls]);
    } catch (error: any) {
      console.error("Erro no upload R2:", error);
      alert(error.message || "Houve um erro ao subir os arquivos.");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  if (!isOpen || !project || !projectId) return null;

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

      await emitParecer(orgId, projectId, payload, orgRole as string);

      const draftKey = `draft_parecer_${projectId}`;
      localStorage.removeItem(draftKey);

      setParecerText("");
      setGut({ gravidade: 3, urgencia: 3, tendencia: 3 });
      setUpdateGUT(false); setLocation(""); setTechnicalTitle(""); setStartDate(""); setEndDate("");
      setAttachments([]); setShowMap(false);

      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || error.response?.data?.message || "Erro interno ao emitir o parecer.");
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
      <div className={`bg-background w-full h-full md:h-[95vh] rounded-none md:rounded-md shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 transition-all ${showMap ? 'md:max-w-4xl' : 'md:max-w-7xl'}`}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              {showMap ? <MapIcon className="w-5 h-5 text-primary" /> : <Activity className="w-5 h-5 text-primary" />}
              {showMap ? 'Anexar Coordenadas no Parecer' : 'Parecer Técnico'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px] md:max-w-full">
              Demanda: <span className="font-medium text-foreground">{project.title}</span>
            </p>
          </div>
          <button onClick={() => showMap ? setShowMap(false) : onClose()} className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {showMap ? (
          <div className="flex-1 flex flex-col relative bg-muted min-h-[50vh]">
            <div ref={mapRef} className="w-full h-full cursor-crosshair" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur shadow-xl border border-border rounded-md p-3 flex items-center gap-4 w-11/12 max-w-md">
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

              <div className="order-2 md:order-1 w-full md:w-[380px] flex-shrink-0 p-5 md:p-6 border-t md:border-t-0 md:border-r border-border md:overflow-y-auto bg-card space-y-8 z-20">

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-3">
                    <ArrowRightCircle className="w-4 h-4 text-primary" /> Status da Demanda
                  </label>
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value)} 
                    className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 font-semibold text-foreground shadow-sm"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {isPlanningMode && (
                  <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Para transferir esta demanda para o Backlog da Engenharia, defina o Escopo Técnico.
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-muted-foreground" /> Nome Técnico do Projeto <span className="text-destructive">*</span>
                      </label>
                      <input type="text" required placeholder="Ex: Reforma Estrutural da Cobertura..." value={technicalTitle} onChange={(e) => setTechnicalTitle(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Início Est.</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none text-muted-foreground" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fim Est.</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-border">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-input text-primary focus:ring-ring accent-primary cursor-pointer bg-background" checked={updateGUT} onChange={(e) => setUpdateGUT(e.target.checked)} />
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Flame className={`w-4 h-4 ${updateGUT ? 'text-orange-500' : 'text-muted-foreground'}`} /> Alterar Prioridade (GUT)
                    </span>
                  </label>
                  {updateGUT && (
                    <div className="space-y-5 bg-background border border-border rounded-md p-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center pb-2 mb-2 border-b border-dashed border-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Nova prioridade</span>
                        <p className={`text-xl font-black leading-none ${currentScore >= 60 ? 'text-destructive' : 'text-primary'}`}>{currentScore}</p>
                      </div>
                      <ScoreSelector label="Gravidade" description="Danos" value={gut.gravidade} onChange={(v) => setGut({ ...gut, gravidade: v })} />
                      <ScoreSelector label="Urgência" description="Tempo" value={gut.urgencia} onChange={(v) => setGut({ ...gut, urgencia: v })} />
                      <ScoreSelector label="Tendência" description="Piora?" value={gut.tendencia} onChange={(v) => setGut({ ...gut, tendencia: v })} />
                    </div>
                  )}
                </div>

              </div>

              <div className="order-1 md:order-2 flex-1 flex flex-col bg-muted/50 relative">
                
                <div className="px-5 py-3 border-b border-border bg-card flex flex-wrap gap-2 items-center justify-between text-sm font-medium text-muted-foreground flex-shrink-0 shadow-sm z-30">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Laudo / Corpo do Parecer <span className="text-destructive">*</span></span>

                  <div className="flex gap-2 ml-auto">
                    <label className={`cursor-pointer text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors px-2 py-1.5 rounded border ${isUploadingFiles ? 'bg-muted text-muted-foreground border-border cursor-not-allowed' : 'text-primary hover:bg-primary/10 bg-primary/5 border-primary/20'}`}>
                      {isUploadingFiles ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
                      {isUploadingFiles ? 'Enviando...' : 'Anexar'}
                      <input type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploadingFiles} />
                    </label>

                    <button type="button" onClick={() => setShowMap(true)} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 flex items-center gap-1 transition-colors bg-primary/5 px-2 py-1.5 rounded border border-primary/20">
                      <MapIcon className="w-3 h-3" /> Ver Mapa
                    </button>
                    <button type="button" onClick={handleGetLocation} disabled={isGettingLocation} className="text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10 flex items-center gap-1 transition-colors bg-primary/5 px-2 py-1.5 rounded border border-primary/20">
                      {isGettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />} Usar GPS
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center w-full">
                  
                  {/* PAPEL A4 SIMPLIFICADO E AUTO-EXPANSÍVEL */}
                  <div 
                    className="relative w-full max-w-[210mm] bg-card border border-border shadow-md rounded-sm flex flex-col mb-6 shrink-0"
                    style={{ minHeight: '297mm' }}
                  >
                    
                    {/* Linha Tracejada Infinita (Corte de Página a cada 297mm) */}
                    <div 
                      className="absolute inset-0 pointer-events-none rounded-sm opacity-60"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent calc(297mm - 2px), rgba(59, 130, 246, 0.6) calc(297mm - 2px), rgba(59, 130, 246, 0.6) 297mm)',
                        backgroundSize: '100% 297mm'
                      }}
                    />
                    
                    {location && (
                      <div className="relative z-20 px-8 pt-8 pb-3 border-b border-dashed border-border flex items-start gap-3 bg-card rounded-t-sm shrink-0">
                        <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="w-full">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Localização Anexada ao Parecer</p>
                          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço complementar ou coordenadas" className="w-full bg-transparent text-sm font-medium text-foreground focus:outline-none" />
                        </div>
                      </div>
                    )}

                    {/* Container GRID para Auto-Resize Nativo do CSS */}
                    <div 
                      className="relative z-20 grid w-full px-8 pb-8 flex-1"
                      style={{ paddingTop: location ? '1.5rem' : '3rem' }}
                    >
                      <textarea
                        required
                        placeholder="Inicie aqui a redação do seu parecer técnico..."
                        value={parecerText}
                        onChange={(e) => setParecerText(e.target.value)}
                        className="resize-none overflow-hidden bg-transparent w-full col-start-1 col-end-2 row-start-1 row-end-2 focus:outline-none text-base leading-relaxed placeholder:text-muted-foreground m-0 p-0 border-none break-words"
                      />
                      {/* Fantasma Invsível (Força a expansão matemática do Grid e do Papel) */}
                      <div 
                        className="invisible whitespace-pre-wrap w-full col-start-1 col-end-2 row-start-1 row-end-2 text-base leading-relaxed break-words m-0 p-0 border-none"
                        aria-hidden="true"
                      >
                        {parecerText + ' '}
                      </div>
                    </div>

                    {/* BLOCO DE ASSINATURAS (Sempre ao final do documento) */}
                    <div className="relative z-20 mt-auto border-t border-dashed border-border bg-muted/20 p-8 pb-12 text-center shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">
                        O espaço abaixo será utilizado para assinaturas na exportação
                      </p>
                      <div className="flex flex-wrap justify-center gap-8 opacity-40">
                         <div className="w-32 border-t border-border pt-2 text-[10px] uppercase font-bold text-muted-foreground">Responsável Técnico</div>
                         <div className="w-32 border-t border-border pt-2 text-[10px] uppercase font-bold text-muted-foreground">Aprovação Final</div>
                      </div>
                    </div>

                  </div>

                  {attachments.length > 0 && (
                    <div className="w-full max-w-[210mm] mt-4">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Arquivos Enviados para Nuvem ({attachments.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((url, i) => (
                          <div key={i} className="relative group rounded-md overflow-hidden bg-card border border-border flex items-center justify-center w-24 h-24 shadow-sm">
                            {url.toLowerCase().endsWith('.pdf') ? (
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

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-card flex-shrink-0 z-30 relative">
              <button type="button" onClick={onClose} disabled={isSubmitting || isUploadingFiles} className="px-5 py-2.5 text-sm font-medium rounded-md border border-border hover:bg-muted hover:text-foreground transition-colors">Cancelar</button>
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