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
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

// 2. Esquema para Emissão do Parecer Técnico (A Matriz de Prioridade)
export const emitParecerSchema = z.object({
  // Notas de 1 a 5
  // Ex: { gravidade: 5, urgencia: 4, tendencia: 2 }
  priorityDetails: z.record(z.string(), z.number().min(1).max(5)).optional(),
  
  // O texto descritivo do parecer do engenheiro
  parecerText: z.string().min(1, 'O texto do parecer é obrigatório.'),
  
  // O engenheiro pode decidir avançar a demanda para PLANEJAMENTO ou mantê-la como DEMANDA
  newStatus: z.enum(['DEMAND', 'PLANNING', 'EXECUTION', 'COMPLETED']).optional(),
});

export type EmitParecerDto = z.infer<typeof emitParecerSchema>;