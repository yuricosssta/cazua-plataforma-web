import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdValidator = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message:
      'ID inválido (deve ser um ObjectId de 24 caracteres hexadecimais).',
  });

export const createApiClientSchema = z.object({
  name: z.string().min(2, 'Nome deve conter no mínimo 2 caracteres.').trim(),
  allowedOrgIds: z
    .array(objectIdValidator)
    .min(1, 'Pelo menos uma organização deve ser vinculada à aplicação.'),
  defaultRole: z.enum(['MEMBER', 'VIEWER']).optional().default('MEMBER'),
  ownerUserId: objectIdValidator.optional(),
  resetPasswordUrl: z.string().url('URL de recuperação inválida.').optional(),
});

export const updateApiClientSchema = z.object({
  name: z.string().min(2).trim().optional(),
  allowedOrgIds: z
    .array(objectIdValidator)
    .min(1, 'Pelo menos uma organização deve ser vinculada à aplicação.')
    .optional(),
  defaultRole: z.enum(['MEMBER', 'VIEWER']).optional(),
  ownerUserId: objectIdValidator.nullable().optional(),
  resetPasswordUrl: z
    .string()
    .url('URL de recuperação inválida.')
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateApiClientDto = z.infer<typeof createApiClientSchema>;
export type UpdateApiClientDto = z.infer<typeof updateApiClientSchema>;

// Response schemas for Swagger documentation
export const apiClientResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  clientId: z.string(),
  allowedOrgIds: z.array(z.string()),
  defaultRole: z.enum(['MEMBER', 'VIEWER']),
  ownerUserId: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        name: z.string(),
        email: z.string(),
      }),
    ])
    .nullable()
    .optional(),
  resetPasswordUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const createApiClientResponseSchema = apiClientResponseSchema.extend({
  clientSecret: z
    .string()
    .describe(
      'Segredo gerado para a aplicação. ATENÇÃO: guarde este valor com segurança, ele NÃO será exibido novamente.',
    ),
});

export const rotateSecretResponseSchema = z.object({
  message: z.string(),
  clientId: z.string(),
  clientSecret: z
    .string()
    .describe(
      'Novo segredo gerado para a aplicação. O segredo anterior foi invalidado.',
    ),
});
