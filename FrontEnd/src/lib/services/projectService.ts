// src/lib/services/projectService.ts
import axiosInstance from '../api/axiosInstance';

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