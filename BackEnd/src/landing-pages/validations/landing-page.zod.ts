//src/modules/validations/landing-page.zod.ts
import { z } from 'zod';

export const createLandingPageSchema = z.object({
  tenantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de tenant inválido'),
  domain: z.string().min(3),
  name: z.string().min(2),
  logoUrl: z.string().url().optional(),
  heroTitle: z.string().min(5),
  heroSubtitle: z.string().min(10),
  contentMDX: z.string().optional(),
  theme: z.object({
    primaryHSL: z.string(),
    backgroundHSL: z.string().optional(),
    foregroundHSL: z.string().optional(),
  }),
});