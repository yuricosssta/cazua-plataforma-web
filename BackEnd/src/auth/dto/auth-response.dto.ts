import { z } from 'zod';
import { userResponseSchema } from '../../users/validations/users.zod';

export const tokenResponseSchema = z.object({
  access_token: z
    .string()
    .describe('JSON Web Token assinado para autenticação Bearer.'),
});

export const jwtPayloadSchema = z.object({
  sub: z.string().describe('ID do usuário (ObjectId).'),
  name: z.string().describe('Nome do usuário.'),
  email: z.string().describe('E-mail do usuário.'),
  isSuperAdmin: z
    .boolean()
    .describe('Indica se o usuário é o Super Administrador do sistema.'),
  iss: z.string().optional().describe('Emissor do token (cazua).'),
  aud: z.string().optional().describe('Audiência pretendida (cazua-api).'),
  iat: z.number().optional().describe('Timestamp de emissão.'),
  exp: z.number().optional().describe('Timestamp de expiração.'),
});

export const registerResponseSchema = z.object({
  user: userResponseSchema,
  access_token: z.string(),
  linked: z
    .boolean()
    .describe(
      'Indica se o usuário já possuía conta no Cazuá e foi apenas vinculado à organização informada.',
    ),
});
