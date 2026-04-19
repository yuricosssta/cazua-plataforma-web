//src/lib/services/organizationService.ts
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiFetchMyOrganizations = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/organizations/my-orgs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (err: any) {
    throw err.response?.data || 'Erro ao conectar com o servidor';
  }
};

export const apiCreateOrganization = async (token: string, name: string, acronym: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/organizations`,
      { name, acronym },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || 'Erro ao criar organização';
  }
};

export const apiGetOrgMembers = async (orgId: string) => {
  const response = await axiosInstance.get(`/organizations/${orgId}/members`);
  return response.data;
};

export const apiCreateOrgMember = async (orgId: string, memberData: any) => {
  const response = await axiosInstance.post(`/organizations/${orgId}/members`, memberData);
  return response.data;
};

export const apiUpdateOrgMemberRole = async (orgId: string, memberId: string, role: string) => {
  const response = await axiosInstance.patch(`/organizations/${orgId}/members/${memberId}/role`, { role });
  return response.data;
};

export const apiRemoveOrgMember = async (orgId: string, memberId: string) => {
  const response = await axiosInstance.delete(`/organizations/${orgId}/members/${memberId}`);
  return response.data;
};