//src/validations/tenant.zod.ts
import { z } from 'zod';

export const tenantOrganizationSettingsSchema = z.object({
  logoUrl: z.string().url().nullable(),
  primaryColorHex: z.string(),
});

export const tenantLandingPageSchema = z.object({
  organizationId: z.string(),
  isActive: z.boolean(),
  name: z.string(),
  organizationSettings: tenantOrganizationSettingsSchema,
});

export type TenantLandingPageDTO = z.infer<typeof tenantLandingPageSchema>;