import { z } from 'zod';

export const addMemberSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.').trim(),
  email: z.string().trim().toLowerCase().email('Formato de e-mail inválido.'),
  password: z
    .string()
    .min(8, 'A senha deve conter no mínimo 8 caracteres.')
    .optional(),
  role: z
    .enum(['ADMIN', 'MEMBER', 'VIEWER'], {
      errorMap: () => ({
        message: 'Cargo inválido. Cargos permitidos: ADMIN, MEMBER, VIEWER.',
      }),
    })
    .optional()
    .default('MEMBER'),
});

export type AddMemberDto = z.infer<typeof addMemberSchema>;

export const memberResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  membership: z.object({
    organizationId: z.string(),
    role: z.string(),
  }),
});
