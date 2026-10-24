import { z } from 'zod';
import { Types } from 'mongoose';

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.').trim(),
  email: z.string().trim().toLowerCase().email('Formato de e-mail inválido.'),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres.'),
  orgId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: 'ID de organização inválido.',
  }),
});

export type RegisterDto = z.infer<typeof registerSchema>;
