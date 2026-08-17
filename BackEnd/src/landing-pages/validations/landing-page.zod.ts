//src/landing-pages/validations/landing-page.zod.ts
import { z } from 'zod';

export const upsertLandingPageSchema = z.object({
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
  isActive: z.boolean(),
});

export type UpsertLandingPageDTO = z.infer<typeof upsertLandingPageSchema>;
//fim