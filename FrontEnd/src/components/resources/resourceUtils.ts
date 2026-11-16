//src/components/resources/resourceUtils.ts
import {
  PopulatedResourceSummary,
  PopulatedUser,
} from "@/lib/services/resourceService";

export function formatCurrencyBR(value?: number | null): string {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(Number(value))
  ) {
    return "-";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatQuantityBR(value?: number | null): string {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(Number(value))
  ) {
    return "-";
  }
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 4,
  }).format(Number(value));
}

export function parseFlexibleDecimal(raw: string): number {
  const cleaned = raw.trim().replace(/[R$\s]/g, "");
  if (!cleaned) return Number.NaN;

  let normalized = cleaned;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function getLocalDateISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTimeBR(dateString?: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getUserDisplayName(
  user?: string | PopulatedUser | null
): string {
  if (!user) return "Usuário não identificado";
  if (typeof user === "string") return "Usuário do sistema";
  return user.name || user.email || "Usuário sem nome";
}

export function getUserDisplayEmail(
  user?: string | PopulatedUser | null
): string | null {
  if (!user || typeof user === "string") return null;
  return user.email || null;
}

export function getPopulatedResourceId(
  resourceId: string | PopulatedResourceSummary
): string {
  return typeof resourceId === "string" ? resourceId : resourceId?._id || "";
}
