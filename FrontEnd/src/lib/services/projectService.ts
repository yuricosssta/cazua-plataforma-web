// src/lib/services/projectService.ts
import { fetchBff } from '@/lib/api/fetchBff';

export const listProjects = async (orgId: string) => {
  return fetchBff(`/api/organizations/${orgId}/projects`, {
    headers: { 'x-org-id': orgId },
  });
};

export const apiAssignMember = async (orgId: string, projectId: string, memberId: string, memberName: string) => {
  return fetchBff(`/api/organizations/${orgId}/projects/${projectId}/members`, {
    method: 'POST',
    headers: { 'x-org-id': orgId },
    body: JSON.stringify({ memberId, memberName }),
  });
};

export const apiRemoveMember = async (orgId: string, projectId: string, memberId: string, memberName: string) => {
  return fetchBff(`/api/organizations/${orgId}/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
    headers: { 'x-org-id': orgId },
    body: JSON.stringify({ memberName }),
  });
};

export const getProjectDetails = async (orgId: string, projectId: string) => {
  return fetchBff(`/api/organizations/${orgId}/projects/${projectId}`, {
    headers: { 'x-org-id': orgId },
  });
};

export const emitParecer = async (orgId: string, projectId: string, payload: any, orgRole: string) => {
  return fetchBff(`/api/organizations/${orgId}/projects/${projectId}/parecer`, {
    method: 'POST',
    headers: { 'x-org-id': orgId, 'x-org-role': orgRole },
    body: JSON.stringify(payload),
  });
};