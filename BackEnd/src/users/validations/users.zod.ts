import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional().default('MEMBER'),
  memberships: z.array(
    z.object({
      organizationId: z.string(),
      role: z.string(),
    })
  ).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  memberships: z.array(
    z.object({
      organizationId: z.string(),
      role: z.string(),
    })
  ).optional(),
});

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;