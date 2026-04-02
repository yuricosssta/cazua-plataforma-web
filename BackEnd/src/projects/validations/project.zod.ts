// BackEnd/src/projects/validations/projects.zod.ts

import { z } from 'zod';

// 1. Esquema para Criação da Obra/Demanda
export const createProjectSchema = z.object({
  title: z.string().min(1, 'O título da obra/demanda é obrigatório.'),
  description: z.string().min(1, 'A descrição é obrigatória e deve ter pelo menos 1 caracter.'),
  location: z.string().min(1, 'A localização é obrigatória.'),
  status: z.enum(['DEMAND', 'PLANNING', 'EXECUTION', 'COMPLETED']).optional().default('DEMAND'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// 2. Esquema para Emissão do Parecer Técnico (A Matriz de Prioridade)
export const emitParecerSchema = z.object({
  // Notas de 1 a 5
  // Ex: { gravidade: 5, urgencia: 4, tendencia: 2 }
  priorityDetails: z.record(z.string(), z.number().min(1).max(5)).optional(),

  // O texto descritivo do parecer do engenheiro
  parecerText: z.string().min(1, 'O texto do parecer é obrigatório.'),

  // O engenheiro pode decidir avançar a demanda para PLANEJAMENTO ou mantê-la como DEMANDA
  newStatus: z.enum(['DEMAND', 'PLANNING', 'EXECUTION', 'COMPLETED']).optional(),

  // Campos adicionais para atualização do projeto
  technicalTitle: z.string().optional(), // Título técnico específico para o parecer
  startDate: z.string().optional(), // Nova data de início, se aplicável
  endDate: z.string().optional(), // Nova data de término, se aplicável
  location: z.string().optional(), // Nova localização, se aplicável
});

export const bulkImportItemSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['DEMAND', 'PLANNING', 'EXECUTION', 'COMPLETED']).optional().default('DEMAND'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  // O preprocess converte string "125" para número 125 antes de validar os limites
  priority: z.preprocess((val) => Number(val), z.number().min(1).max(125)).optional().default(1),
});

export const bulkImportSchema = z.object({
  projects: z.array(bulkImportItemSchema).min(1, 'A lista de importação não pode estar vazia.')
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
export type EmitParecerDto = z.infer<typeof emitParecerSchema>;
export type BulkImportDto = z.infer<typeof bulkImportSchema>;