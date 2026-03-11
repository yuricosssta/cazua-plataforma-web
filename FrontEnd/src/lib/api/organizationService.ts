// src/lib/api/organizationService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiFetchMyOrganizations = async (token: string) => {
  try {
    const response = await axios.get(`${API_URL}/organizations/my-orgs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data; // Espera-se um array de organizações
  } catch (err: any) {
    throw err.response?.data || 'Erro ao conectar com o servidor';
  }
};

export const apiCreateOrganization = async (token: string, name: string) => {
  try {
    const response = await axios.post(
      `${API_URL}/organizations`, 
      { name }, // Body
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || 'Erro ao criar organização';
  }
};