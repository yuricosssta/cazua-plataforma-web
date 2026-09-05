//src/landing-pages/validations/landing-page.zod.ts
import { z } from 'zod';

export const upsertLandingPageSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/,
      'Domínio inválido (ex: construtora.com.br)',
    )
    .min(3)
    .optional()
    .or(z.literal('')),
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().optional(),
  heroTitle: z.string().min(5).optional(),
  heroSubtitle: z.string().min(10).optional(),
  contentMDX: z.string().optional(),
  theme: z
    .object({
      primaryHSL: z.string().min(1),
      backgroundHSL: z.string().optional(),
      foregroundHSL: z.string().optional(),
    })
    .optional(),
  isActive: z.boolean(),
});

export type UpsertLandingPageDTO = z.infer<typeof upsertLandingPageSchema>;
//fim
