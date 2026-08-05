// src/auth/dto/sign-in.dto.ts
import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.'),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres.'),
});

export type SignInDto = z.infer<typeof signInSchema>;