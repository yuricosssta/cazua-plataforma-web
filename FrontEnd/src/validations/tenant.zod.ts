//src/validations/tenant.zod.ts
import { z } from 'zod';

export const tenantThemeSchema = z.object({
  primaryHSL: z.string().min(1, "A cor primária em HSL é obrigatória"),
  backgroundHSL: z.string().optional(),
  foregroundHSL: z.string().optional(),
});

export const tenantLandingPageSchema = z.object({
  organizationId: z.string(),
  domain: z.string().nullable().optional(),
  name: z.string(),
  logoUrl: z.string().url().optional(),
  organizationLogoUrl: z.string().url().optional(),
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  theme: tenantThemeSchema,
  isActive: z.boolean(),
  contentMDX: z.string().optional(),
});

export type TenantLandingPageDTO = z.infer<typeof tenantLandingPageSchema>;