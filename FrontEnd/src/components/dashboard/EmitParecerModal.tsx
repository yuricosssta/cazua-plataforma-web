//src/components/dashboard/EmitParecerModal.tsx
"use client";

import React, { useState } from "react";
import { X, Loader2, Activity, MessageSquare, ArrowRightCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
import axios from "axios";

interface Project {
  id: string;
  title: string;
  status: string;
}

interface EmitParecerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project | null;
}

export function EmitParecerModal({ isOpen, onClose, onSuccess, project }: EmitParecerModalProps) {
  const currentOrg = useSelector(selectCurrentOrg);
  const token = useSelector((state: RootState) => state.auth.token);

  const getOrgId = (): string => {
    if (!currentOrg?.organizationId) return "";
    if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
      return (currentOrg.organizationId as any)._id;
    }
    return currentOrg.organizationId as string;
  };
  const orgId = getOrgId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gut, setGut] = useState({ gravidade: 3, urgencia: 3, tendencia: 3 });
  const [parecerText, setParecerText] = useState("");
  const [newStatus, setNewStatus] = useState("PLANNING");

  if (!isOpen || !project) return null;

  const currentScore = gut.gravidade * gut.urgencia * gut.tendencia;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return alert("Erro: Organização não identificada.");
    if (!parecerText.trim()) return alert("O texto do parecer é obrigatório.");

    try {
      setIsSubmitting(true);
      const payload = { priorityDetails: gut, parecerText, newStatus };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/projects/${project.id}/parecer`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setParecerText("");
      setGut({ gravidade: 3, urgencia: 3, tendencia: 3 });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erro ao emitir parecer:", error);
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
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all border ${
              value === num 
                ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' 
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
      
      {/* Modal Gigante (6xl) para imersão total no desktop, 100% no mobile */}
      <div className="bg-background w-full h-full md:h-[100vh] md:max-w-7xl rounded-none md:rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Parecer Técnico
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px] md:max-w-full">
              Demanda: <span className="font-medium text-foreground">{project.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulário Flexível com rolagem no mobile */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
            
            {/* COLUNA ESQUERDA: Matriz GUT (Abaixo no Mobile, Esquerda no Desktop) */}
            <div className="order-2 md:order-1 w-full md:w-80 flex-shrink-0 p-5 md:p-6 border-t md:border-t-0 md:border-r border-border md:overflow-y-auto bg-muted/10 space-y-6">
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Matriz GUT</h3>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase">Score Final</span>
                    <p className={`text-2xl font-black leading-none ${currentScore >= 60 ? 'text-red-500' : 'text-primary'}`}>
                      {currentScore}
                    </p>
                  </div>
                </div>
                <ScoreSelector label="Gravidade" description="Danos" value={gut.gravidade} onChange={(v) => setGut({...gut, gravidade: v})} />
                <ScoreSelector label="Urgência" description="Tempo" value={gut.urgencia} onChange={(v) => setGut({...gut, urgencia: v})} />
                <ScoreSelector label="Tendência" description="Piora?" value={gut.tendencia} onChange={(v) => setGut({...gut, tendencia: v})} />
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <ArrowRightCircle className="w-4 h-4 text-muted-foreground" />
                  Decisão de Encaminhamento
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 font-medium"
                >
                  <option value="DEMAND">Manter Aguardando (Demanda)</option>
                  <option value="PLANNING">Aprovar para Planejamento</option>
                  <option value="EXECUTION">Enviar direto para Execução</option>
                  <option value="COMPLETED">Encerrar / Improcedente</option>
                </select>
              </div>
            </div>

            {/* COLUNA DIREITA: O "Papel A4" (Topo no Mobile, Direita no Desktop) */}
            <div className="order-1 md:order-2 flex-1 flex flex-col bg-muted/30 relative">
              
              {/* Tooltip Header do Editor */}
              <div className="px-5 py-3 border-b border-border bg-background/50 flex items-center gap-2 text-sm font-medium text-muted-foreground flex-shrink-0">
                <MessageSquare className="w-4 h-4" />
                Laudo / Descrição Técnica <span className="text-red-500">*</span>
              </div>

              {/* Área do Papel com rolagem suave */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center w-full">
                
                {/* O Design da Folha (Max width travado na proporção) */}
                <div className="w-full max-w-[210mm] min-h-[50vh] md:min-h-full bg-background border border-border/50 shadow-md rounded-sm flex flex-col">
                  <textarea
                    required
                    placeholder="Inicie aqui a redação do seu parecer técnico..."
                    value={parecerText}
                    onChange={(e) => setParecerText(e.target.value)}
                    className="flex-1 w-full h-full resize-none p-6 md:p-12 focus-visible:outline-none text-base leading-relaxed placeholder:text-muted-foreground bg-transparent"
                  />
                </div>

              </div>
            </div>

          </div>

          {/* Rodapé Fixo */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-background flex-shrink-0">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium rounded-md border border-border hover:bg-accent hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Assinar e Salvar Parecer
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// "use client";

// import React, { useState } from "react";
// import { X, Loader2, Activity, MessageSquare, ArrowRightCircle } from "lucide-react";
// import { useSelector } from "react-redux";
// import { RootState } from "@/lib/redux/store";
// import { selectCurrentOrg } from "@/lib/redux/slices/organizationSlice";
// import axios from "axios";

// interface Project {
//     id: string;
//     title: string;
//     status: string;
// }

// interface EmitParecerModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onSuccess: () => void;
//     project: Project | null;
// }

// export function EmitParecerModal({ isOpen, onClose, onSuccess, project }: EmitParecerModalProps) {
//     const currentOrg = useSelector(selectCurrentOrg);
//     const token = useSelector((state: RootState) => state.auth.token);

//     const getOrgId = (): string => {
//         if (!currentOrg?.organizationId) return "";
//         if (typeof currentOrg.organizationId === "object" && "_id" in currentOrg.organizationId) {
//             return (currentOrg.organizationId as any)._id;
//         }
//         return currentOrg.organizationId as string;
//     };
//     const orgId = getOrgId();

//     const [isSubmitting, setIsSubmitting] = useState(false);

//     // Estado para a Matriz GUT e os outros campos
//     const [gut, setGut] = useState({ gravidade: 3, urgencia: 3, tendencia: 3 });
//     const [parecerText, setParecerText] = useState("");
//     const [newStatus, setNewStatus] = useState("PLANNING"); // Sugerimos avançar para Planejamento por padrão

//     if (!isOpen || !project) return null;

//     // Calculo em tempo real apenas para feedback visual no modal
//     const currentScore = gut.gravidade * gut.urgencia * gut.tendencia;

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!orgId) return alert("Erro: Organização não identificada.");
//         if (!parecerText.trim()) return alert("O texto do parecer é obrigatório.");

//         try {
//             setIsSubmitting(true);

//             const payload = {
//                 priorityDetails: gut,
//                 parecerText,
//                 newStatus,
//             };

//             await axios.post(
//                 `${process.env.NEXT_PUBLIC_API_BASE_URL}/organizations/${orgId}/projects/${project.id}/parecer`,
//                 payload,
//                 {
//                     headers: { Authorization: `Bearer ${token}` }
//                 }
//             );

//             // Limpa os dados e fecha
//             setParecerText("");
//             setGut({ gravidade: 3, urgencia: 3, tendencia: 3 });
//             onSuccess();
//             onClose();

//         } catch (error: any) {
//             console.error("Erro ao emitir parecer:", error);
//             alert(error.response?.data?.message || "Erro interno ao emitir o parecer.");
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     // Componente interno para renderizar a escala de 1 a 5 para cada critério da Matriz GUT
//     const ScoreSelector = ({ label, description, value, onChange }: { label: string, description: string, value: number, onChange: (v: number) => void }) => (
//         <div className="space-y-2">
//             <div className="flex justify-between items-end">
//                 <label className="text-sm font-semibold text-foreground">{label}</label>
//                 <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{description}</span>
//             </div>
//             <div className="flex justify-between gap-2">
//                 {[1, 2, 3, 4, 5].map((num) => (
//                     <button
//                         key={num}
//                         type="button"
//                         onClick={() => onChange(num)}
//                         className={`flex-1 py-2 rounded-md text-sm font-bold transition-all border ${value === num
//                                 ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
//                                 : 'bg-background text-muted-foreground border-border hover:border-primary/50'
//                             }`}
//                     >
//                         {num}
//                     </button>
//                 ))}
//             </div>
//         </div>
//     );

//     return (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//             <div className="bg-background w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

//                 {/* Cabeçalho */}
//                 <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 flex-shrink-0">
//                     <div>
//                         <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
//                             <Activity className="w-5 h-5 text-primary" />
//                             Emitir Parecer Técnico
//                         </h2>
//                         <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
//                             Avaliando: <span className="font-medium text-foreground">{project.title}</span>
//                         </p>
//                     </div>
//                     <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
//                         <X className="w-5 h-5" />
//                     </button>
//                 </div>

//                 {/* Formulário com Scroll (caso a tela do celular seja pequena) */}
//                 <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-6 flex-1">

//                     {/* Matriz GUT */}
//                     <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border/50">
//                         <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
//                             <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Matriz de Prioridade (GUT)</h3>
//                             <div className="text-right">
//                                 <span className="text-[10px] text-muted-foreground uppercase">Score Final</span>
//                                 <p className={`text-xl font-black leading-none ${currentScore >= 60 ? 'text-red-500' : 'text-primary'}`}>
//                                     {currentScore}
//                                 </p>
//                             </div>
//                         </div>

//                         <ScoreSelector
//                             label="Gravidade" description="Danos potenciais"
//                             value={gut.gravidade} onChange={(v) => setGut({ ...gut, gravidade: v })}
//                         />
//                         <ScoreSelector
//                             label="Urgência" description="Pressão do tempo"
//                             value={gut.urgencia} onChange={(v) => setGut({ ...gut, urgencia: v })}
//                         />
//                         <ScoreSelector
//                             label="Tendência" description="Piora se não agir?"
//                             value={gut.tendencia} onChange={(v) => setGut({ ...gut, tendencia: v })}
//                         />
//                     </div>

//                     {/* Texto do Parecer */}
//                     <div className="space-y-1.5">
//                         <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
//                             <MessageSquare className="w-4 h-4 text-muted-foreground" />
//                             Conclusão / Descrição Técnica <span className="text-red-500">*</span>
//                         </label>
//                         <textarea
//                             required
//                             rows={3}
//                             placeholder="Descreva sua avaliação técnica da demanda..."
//                             value={parecerText}
//                             onChange={(e) => setParecerText(e.target.value)}
//                             className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 resize-none"
//                         />
//                     </div>

//                     {/* Encaminhamento (Novo Status) */}
//                     <div className="space-y-1.5">
//                         <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
//                             <ArrowRightCircle className="w-4 h-4 text-muted-foreground" />
//                             Encaminhamento da Obra
//                         </label>
//                         <select
//                             value={newStatus}
//                             onChange={(e) => setNewStatus(e.target.value)}
//                             className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
//                         >
//                             <option value="DEMAND">Manter como Demanda (Aguardando)</option>
//                             <option value="PLANNING">Aprovar para Planejamento (TAP)</option>
//                             <option value="EXECUTION">Enviar direto para Execução</option>
//                             <option value="COMPLETED">Encerrar / Improcedente</option>
//                         </select>
//                     </div>



//                     {/* Rodapé fixo */}
//                     <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-background flex-shrink-0">
//                         <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-foreground">
//                             Cancelar
//                         </button>
//                         <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 shadow-sm">
//                             {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
//                             Salvar Parecer
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }