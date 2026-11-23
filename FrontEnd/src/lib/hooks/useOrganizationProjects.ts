// src/lib/hooks/useOrganizationProjects.ts
import { queryOptions, useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/services/projectService";
import type { ProjectStatus } from "@/types/project";

export interface IOrganizationProjectLastEvent {
  _id?: string;
  createdAt?: string;
  authorId?: { name?: string };
  description?: string;
  type?: string;
}

export interface IOrganizationProjectOption {
  _id?: string;
  id?: string;
  title?: string;
  referenceCode?: string;
  status?: ProjectStatus;
  description?: string;
  progress?: number;
  location?: string;
  startDate?: string;
  endDate?: string;
  priorityScore?: number;
  createdAt?: string;
  updatedAt?: string;
  assignedMembers?: unknown[];
  attachments?: string[];
  lastEventId?: IOrganizationProjectLastEvent | null;
}

export const ORGANIZATION_PROJECTS_QUERY_KEY = (orgId: string) =>
  ["projects", orgId] as const;

/**
 * Opções compartilhadas do React Query para listar projetos de uma organização.
 */
export function getOrganizationProjectsQueryOptions(orgId: string) {
  return queryOptions<IOrganizationProjectOption[]>({
    queryKey: ORGANIZATION_PROJECTS_QUERY_KEY(orgId),
    queryFn: async () => {
      const data = await listProjects(orgId);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook compartilhado para consumir os projetos da organização com cache em memória.
 */
export function useOrganizationProjects(orgId?: string, enabled = true) {
  return useQuery({
    ...getOrganizationProjectsQueryOptions(orgId ?? ""),
    enabled: Boolean(orgId) && enabled,
  });
}
