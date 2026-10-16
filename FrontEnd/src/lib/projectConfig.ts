// src/lib/projectConfig.ts
import {
  AlertCircle, CheckCircle, FileText, HardHat, Lock, PauseCircle,
  Flame, Activity, Clock, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import type { ProjectStatus } from "@/types/project";

interface ConfigItem {
  label: string;
  icon: typeof AlertCircle;
  color: string;
  bg: string;
}

const DEMAND: ConfigItem = {
  label: "Demanda",
  icon: AlertCircle,
  color: "text-primary",
  bg: "border border-primary-border bg-primary-bg",
};

const PLANNING: ConfigItem = {
  label: "Planejamento",
  icon: FileText,
  color: "text-st-planning",
  bg: "border border-st-planning-border bg-st-planning-bg",
};

const EXECUTION: ConfigItem = {
  label: "Em Execução",
  icon: HardHat,
  color: "text-st-execution",
  bg: "border border-st-execution-border bg-st-execution-bg",
};

const COMPLETED: ConfigItem = {
  label: "Concluída",
  icon: CheckCircle,
  color: "text-st-completed",
  bg: "border border-st-completed-border bg-st-completed-bg",
};

const ON_HOLD: ConfigItem = {
  label: "Paralisada",
  icon: PauseCircle,
  color: "text-st-onhold",
  bg: "border border-st-onhold-border bg-st-onhold-bg",
};

const INVALID: ConfigItem = {
  label: "Inválida",
  icon: Lock,
  color: "text-muted-foreground",
  bg: "border border-border bg-muted",
};

const UNKNOWN: ConfigItem = {
  label: "Desconhecido",
  icon: AlertCircle,
  color: "text-muted-foreground",
  bg: "border border-border bg-muted",
};

const STATUS_MAP: Record<ProjectStatus, ConfigItem> = {
  DEMAND,
  PLANNING,
  EXECUTION,
  COMPLETED,
  ON_HOLD,
  INVALID,
};

export function getStatusConfig(status: ProjectStatus): ConfigItem {
  return STATUS_MAP[status] ?? UNKNOWN;
}

export function getPriorityConfig(score?: number): ConfigItem {
  const rounded = score ? Math.round(score) : 0;

  if (!rounded) {
    return {
      label: "Sem Prioridade",
      icon: Minus,
      color: "text-muted-foreground",
      bg: "border border-dashed border-border bg-transparent",
    };
  }

  if (rounded >= 100) {
    return {
      label: `Crítica (${rounded})`,
      icon: Flame,
      color: "text-pri-critical",
      bg: "border border-pri-critical-border bg-pri-critical-bg",
    };
  }

  if (rounded >= 60) {
    return {
      label: `Alta (${rounded})`,
      icon: ArrowUp,
      color: "text-pri-high",
      bg: "border border-pri-high-border bg-pri-high-bg",
    };
  }

  if (rounded >= 30) {
    return {
      label: `Média (${rounded})`,
      icon: Activity,
      color: "text-pri-medium",
      bg: "border border-pri-medium-border bg-pri-medium-bg",
    };
  }

  return {
    label: `Baixa (${rounded})`,
    icon: ArrowDown,
    color: "text-pri-low",
    bg: "border border-pri-low-border bg-pri-low-bg",
  };
}