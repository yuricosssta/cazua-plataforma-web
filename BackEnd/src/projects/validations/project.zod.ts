// BackEnd/src/projects/validations/projects.zod.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1, 'O título da obra/demanda é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória e deve ter pelo menos 1 caracter.'),
  location: z.string().min(1, 'A localização é obrigatória.'),
  status: z.enum(['DEMAND', 'PLANNING', 'EXECUTION', 'COMPLETED', 'INVALID', 'ON_HOLD']).optional().default('DEMAND'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const emitParecerSchema = z.object({
  priorityDetails: z.record(z.string(), z.number().min(1).max(5)).optional(),
  parecerText: z.string().min(1, 'O texto do parecer é obrigatório.'),
  newStatus: z.enum(['DEMAND', 'PLANNING', 'EXECUTION', 'COMPLETED', 'INVALID', 'ON_HOLD']).optional(),
  technicalTitle: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const bulkImportItemSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['DEMAND', 'PLANNING', 'EXECUTION', 'COMPLETED', 'INVALID', 'ON_HOLD']).optional().default('DEMAND'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.preprocess((val) => Number(val), z.number().min(1).max(125)).optional().default(1),
  attachments: z.array(z.string()).optional(),
});

export const bulkImportSchema = z.object({
  projects: z.array(bulkImportItemSchema).min(1, 'A lista de importação não pode estar vazia.')
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type EmitParecerDto = z.infer<typeof emitParecerSchema>;
export type BulkImportDto = z.infer<typeof bulkImportSchema>;