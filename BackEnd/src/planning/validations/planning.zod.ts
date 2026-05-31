import { z } from 'zod';

const parseBoolean = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}, z.boolean());

const parseNullableString = z.preprocess((value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }
  return String(value);
}, z.string().nullable());

const parseNumber = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    if (normalized.length === 0) return undefined;
    return Number(normalized);
  }
  return value;
}, z.number().int().nonnegative());

const parsePositiveNumber = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    if (normalized.length === 0) return undefined;
    return Number(normalized);
  }
  return value;
}, z.number().nonnegative());

export const uploadPlanningSchema = z.object({
  isGlobal: parseBoolean,
  organizationId: parseNullableString.default(null),
  state: z.string().min(1, 'O estado é obrigatório'),
  referenceMonth: parseNumber,
  referenceYear: parseNumber,
});

export const searchPlanningSchema = z.object({
  q: z.string().optional(),
  isGlobal: parseBoolean.optional(),
  organizationId: z.string().optional(),
  state: z.string().optional(),
  referenceMonth: parseNumber.optional(),
  referenceYear: parseNumber.optional(),
  grupo: z.string().optional(),
  codigoComposicao: z.string().optional(),
  tipo: z.string().optional(),
  insumo: z.string().optional(),
  summaryOnly: parseBoolean.default(true),
  page: parseNumber.default(1),
  limit: parseNumber.default(20),
  groupBy: z.string().optional(),
});

export type UploadPlanningDto = z.infer<typeof uploadPlanningSchema>;
export type SearchPlanningDto = z.infer<typeof searchPlanningSchema>;
