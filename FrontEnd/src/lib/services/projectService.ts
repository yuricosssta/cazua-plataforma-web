// src/lib/services/projectService.ts
import axiosInstance from '../api/axiosInstance';

// LISTAGEM DE PROJETOS / DEMANDAS
export const listProjects = async (orgId: string) => {
  try {
    const response = await axiosInstance.get(`/organizations/${orgId}/projects`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || 'Erro ao listar os projetos';
  }
};

// ALOCAÇÃO DE EQUIPE
export const apiAssignMember = async (orgId: string, projectId: string, memberId: string, memberName: string) => {
  try {
    const response = await axiosInstance.post(`/organizations/${orgId}/projects/${projectId}/members`, {
      memberId,
      memberName
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || 'Erro ao adicionar membro';
  }
};

// REMOÇÃO DE EQUIPE (E SAIR DA OBRA)
export const apiRemoveMember = async (orgId: string, projectId: string, memberId: string, memberName: string) => {
  try {
    const response = await axiosInstance.delete(`/organizations/${orgId}/projects/${projectId}/members/${memberId}`, {
      data: { memberName }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || 'Erro ao remover membro';
  }
};

// BUSCA DETALHES DE UM PROJETO ESPECÍFICO
export const getProjectDetails = async (orgId: string, projectId: string) => {
  try {
    const response = await axiosInstance.get(`/organizations/${orgId}/projects/${projectId}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || 'Erro ao buscar detalhes do projeto';
  }
};

// EMITIR PARECER TÉCNICO
export const emitParecer = async (orgId: string, projectId: string, payload: any, orgRole: string) => {
  try {
    const response = await axiosInstance.post(
      `/organizations/${orgId}/projects/${projectId}/parecer`,
      payload,
      { headers: { 'x-org-role': orgRole } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || new Error('Erro ao emitir parecer');
  }
};
