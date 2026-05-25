// src/resources/validations/resource.zod.ts
import { z } from 'zod';
import { ResourceType } from '../types/resource-enums';
import { Precision } from '../../shared/utils/precision.util'; // Importação do utilitário

// Helper para sanitizar decimais no Zod
const sanitizeNumber = z.number().transform((val) => Precision.round(val, 2));
const sanitizePositiveNumber = z.number().positive("A quantidade deve ser maior que zero").transform((val) => Precision.round(val, 2));

// 1. Catálogo
export const createResourceSchema = z.object({
  name: z.string().min(2, "O nome do recurso é obrigatório"),
  type: z.nativeEnum(ResourceType, { required_error: "Tipo de recurso inválido" }),
  unit: z.string().min(1, "A unidade de medida é obrigatória (ex: un, kg, h)"),
  standardCost: z.number().min(0, "O custo não pode ser negativo").default(0).transform((val) => Precision.round(val, 2)),
});

// 2. Alocação (Estoque -> Obra)
export const allocateResourceSchema = z.object({
  resourceId: z.string().min(1, "O ID do recurso é obrigatório"),
  quantity: sanitizePositiveNumber,
  origin: z.string().optional(),
  attachments: z.array(z.string().url("Formato de anexo inválido")).optional(),
});

// 3. Entrada de Estoque / Compra / Aporte
export const addStockSchema = z.object({
  resourceId: z.string().min(1, "O ID do recurso é obrigatório"),
  quantity: sanitizePositiveNumber,
  unitCostSnapshot: z.number().min(0, "O custo não pode ser negativo").optional().transform((val) => val !== undefined ? Precision.round(val, 2) : val),
  origin: z.string().optional(),
  attachments: z.array(z.string().url("Formato de anexo inválido")).optional(),
});

// 4. Devolução (Obra -> Estoque)
export const returnResourceSchema = z.object({
  resourceId: z.string().min(1, "O ID do recurso é obrigatório"),
  quantity: sanitizePositiveNumber,
  origin: z.string().optional(),
  attachments: z.array(z.string().url("Formato de anexo inválido")).optional(),
});

// 5. Estorno / Cancelamento
export const cancelTransactionSchema = z.object({
  reason: z.string().min(5, "O motivo do cancelamento é obrigatório e deve ser descritivo"),
});

// Aprovação / Rejeição
export const approveRequestSchema = z.object({
  approvedQuantity: z.number().positive("A quantidade aprovada deve ser maior que zero").transform((val) => Precision.round(val, 2)),
});

export const rejectRequestSchema = z.object({
  reason: z.string().min(5, "O motivo da rejeição é obrigatório"),
});

export const projectStatementSchema = z.object({
  totalAccumulated: z.number().transform((val) => Precision.round(val, 2)),
  categories: z.array(z.object({
    type: z.nativeEnum(ResourceType),
    total: z.number().transform((val) => Precision.round(val, 2)),
    percentage: z.number().transform((val) => Precision.round(val, 2))
  })),
  items: z.array(z.object({
    resourceId: z.string(),
    name: z.string(),
    unit: z.string(),
    type: z.nativeEnum(ResourceType),
    quantity: z.number().transform((val) => Precision.round(val, 2)),
    total: z.number().transform((val) => Precision.round(val, 2))
  }))
});

export type CreateResourceDto = z.infer<typeof createResourceSchema>;
export type AllocateResourceDto = z.infer<typeof allocateResourceSchema>;
export type AddStockDto = z.infer<typeof addStockSchema>;
export type ReturnResourceDto = z.infer<typeof returnResourceSchema>;
export type CancelTransactionDto = z.infer<typeof cancelTransactionSchema>;
export type ApproveRequestDto = z.infer<typeof approveRequestSchema>;
export type RejectRequestDto = z.infer<typeof rejectRequestSchema>;
export type ProjectStatementDto = z.infer<typeof projectStatementSchema>;