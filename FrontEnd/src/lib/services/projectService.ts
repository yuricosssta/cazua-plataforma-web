// src/lib/services/projectService.ts
const BASE_URL = '/api';

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(data.message || data.error || `Erro ${res.status}`);
    error.response = { data, status: res.status };
    throw error;
  }
  return data;
}

// LISTAGEM DE PROJETOS / DEMANDAS
export const listProjects = async (orgId: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/projects`);
  return handleResponse(res);
};

// ALOCAÇÃO DE EQUIPE
export const apiAssignMember = async (orgId: string, projectId: string, memberId: string, memberName: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/projects/${projectId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, memberName }),
  });
  return handleResponse(res);
};

// REMOÇÃO DE EQUIPE (E SAIR DA OBRA)
export const apiRemoveMember = async (orgId: string, projectId: string, memberId: string, memberName: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberName }),
  });
  return handleResponse(res);
};

// BUSCA DETALHES DE UM PROJETO ESPECÍFICO
export const getProjectDetails = async (orgId: string, projectId: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/projects/${projectId}`);
  return handleResponse(res);
};

// EMITIR PARECER TÉCNICO
export const emitParecer = async (orgId: string, projectId: string, payload: any, orgRole: string) => {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}/projects/${projectId}/parecer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-org-role': orgRole },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};
