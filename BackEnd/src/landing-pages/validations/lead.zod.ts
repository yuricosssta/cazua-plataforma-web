//src/landing-pages/validations/lead.zod.ts
import { z } from 'zod';

export const createLeadSchema = z.object({
  organizationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'ID de organização inválido'),
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
});

export type CreateLeadDTO = z.infer<typeof createLeadSchema>;
