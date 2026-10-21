import { z } from 'zod';

export const createUserSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail inválido.'),
  name: z.string().min(1, 'Nome é obrigatório.').trim(),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome não pode ser vazio.').trim().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: z
    .string()
    .min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Formato de e-mail inválido.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório.'),
  newPassword: z
    .string()
    .min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
});

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

// Documentação Swagger
export const userResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  isAdmin: z.boolean().optional(),
  rule: z.number().optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
