//src/components/resources/ReturnResourceModal.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/redux/store";
import { returnResourceThunk } from "@/lib/redux/slices/resourcesSlice";
import { Loader2, X } from "lucide-react";

const returnResourceSchema = z.object({
  resourceId: z.string().min(1, "Selecione um recurso para devolver"),
  quantity: z.coerce.number().positive("A quantidade deve ser maior que zero"),
  origin: z.string().optional(),
});

type ReturnResourceFormData = z.infer<typeof returnResourceSchema>;

interface AllocatedResource {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface ReturnResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  projectId: string;
  onSuccess: () => void;
  allocatedResources: AllocatedResource[]; 
}

export function ReturnResourceModal({ isOpen, onClose, orgId, projectId, onSuccess, allocatedResources }: ReturnResourceModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReturnResourceFormData>({
    resolver: zodResolver(returnResourceSchema),
    defaultValues: { quantity: 0, origin: "" }
  });

  if (!isOpen) return null;

  const onSubmit = async (data: ReturnResourceFormData) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const resultAction = await dispatch(returnResourceThunk({ orgId, projectId, data }));
      if (returnResourceThunk.fulfilled.match(resultAction)) {
        reset();
        onSuccess();
        onClose();
      } else {
        setErrorMsg(resultAction.payload as string);
      }
    } catch (error) {
      setErrorMsg("Ocorreu um erro inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md p-6 rounded-lg shadow-lg border border-border relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-bold mb-4">Devolver Recurso ao Almoxarifado</h2>
        
        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-md">{errorMsg}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Insumo / Recurso</label>
            <select 
              {...register("resourceId")} 
              className="w-full p-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="">Selecione um recurso do saldo atual</option>
              {allocatedResources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} (Saldo: {resource.quantity} {resource.unit})
                </option>
              ))}
            </select>
            {errors.resourceId && <p className="text-xs text-red-500 mt-1">{errors.resourceId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantidade a Devolver</label>
            <input 
              type="number" 
              step="0.01"
              {...register("quantity")} 
              className="w-full p-2 border border-border rounded-md bg-background text-sm" 
            />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Justificativa / Origem (Opcional)</label>
            <textarea 
              {...register("origin")} 
              className="w-full p-2 border border-border rounded-md bg-background text-sm" 
              rows={3}
              placeholder="Ex: Sobra de material da concretagem..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirmar Devolução
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}