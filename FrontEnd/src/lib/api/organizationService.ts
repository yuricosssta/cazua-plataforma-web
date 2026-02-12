// src/lib/api/organizationService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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