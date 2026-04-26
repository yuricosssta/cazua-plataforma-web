//src/resources/validations/resource.zod.ts
import { z } from 'zod';
import { ResourceType } from '../types/resource-enums';

// 1. Catálogo
export const createResourceSchema = z.object({
  name: z.string().min(2, "O nome do recurso é obrigatório"),
  type: z.nativeEnum(ResourceType, { required_error: "Tipo de recurso inválido" }),
  unit: z.string().min(1, "A unidade de medida é obrigatória (ex: un, kg, h)"),
  standardCost: z.number().min(0, "O custo não pode ser negativo").default(0),
});

// 2. Alocação (Estoque -> Obra)
export const allocateResourceSchema = z.object({
  resourceId: z.string().min(1, "O ID do recurso é obrigatório"),
  quantity: z.number().positive("A quantidade deve ser maior que zero"),
  origin: z.string().optional(),
  attachments: z.array(z.string().url("Formato de anexo inválido")).optional(),
});

// 3. Entrada de Estoque / Compra / Aporte
export const addStockSchema = z.object({
  resourceId: z.string().min(1, "O ID do recurso é obrigatório"),
  quantity: z.number().positive("A quantidade deve ser maior que zero"),
  unitCostSnapshot: z.number().min(0, "O custo não pode ser negativo").optional(), // Opcional, se não vier, o Back-end usa o preço padrão
  origin: z.string().optional(),
  attachments: z.array(z.string().url("Formato de anexo inválido")).optional(),
});

// 4. Devolução (Obra -> Estoque)
export const returnResourceSchema = z.object({
  resourceId: z.string().min(1, "O ID do recurso é obrigatório"),
  quantity: z.number().positive("A quantidade deve ser maior que zero"),
  origin: z.string().optional(),
  attachments: z.array(z.string().url("Formato de anexo inválido")).optional(),
});

// 5. Estorno / Cancelamento
export const cancelTransactionSchema = z.object({
  reason: z.string().min(5, "O motivo do cancelamento é obrigatório e deve ser descritivo"),
});

export type CreateResourceDto = z.infer<typeof createResourceSchema>;
export type AllocateResourceDto = z.infer<typeof allocateResourceSchema>;
export type AddStockDto = z.infer<typeof addStockSchema>;
export type ReturnResourceDto = z.infer<typeof returnResourceSchema>;
export type CancelTransactionDto = z.infer<typeof cancelTransactionSchema>;