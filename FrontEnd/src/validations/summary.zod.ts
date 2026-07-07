//src/validations/summary.zod.ts
import { z } from 'zod';

export const createReelSchema = z.object({
  tema: z.string().min(1, 'O tema é obrigatório'),
  publico_alvo: z.string().min(1, 'O público-alvo é obrigatório'),
  conteudo_tipo: z.string().min(1, 'O tipo de conteúdo é obrigatório'),
  linha_editorial: z.string().min(1, 'A linha editorial é obrigatória'),
  objetivo: z.string().min(1, 'O objetivo é obrigatório'),
  duracao: z.string().min(1, 'A duração é obrigatória'),
  tom_voz: z.string().min(1, 'O tom de voz é obrigatório'),
  saida: z.string().min(1, 'A saída é obrigatória'),
  rascunho: z.string().min(1, 'O rascunho é obrigatório'),
});

export type CreateReelDto = z.infer<typeof createReelSchema>;