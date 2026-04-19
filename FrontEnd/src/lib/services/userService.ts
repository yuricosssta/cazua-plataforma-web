// src/lib/services/userService.ts
import axiosInstance from '../api/axiosInstance';

export const apiUpdateProfile = async (userId: string, name: string) => {
  try {
    const response = await axiosInstance.put(`/users/${userId}`, { name });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Erro ao atualizar perfil' };
  }
};

export const apiChangePassword = async (passwords: any) => {
  try {
    const response = await axiosInstance.post(`/users/change-password`, passwords);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'Erro ao alterar a senha' };
  }
};