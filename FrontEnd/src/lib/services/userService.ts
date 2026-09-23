// src/lib/services/userService.ts
import { fetchBff } from '@/lib/api/fetchBff';

export const apiUpdateProfile = async (userId: string, name: string) => {
  return fetchBff(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
};

export const apiChangePassword = async (passwords: any) => {
  return fetchBff(`/api/users/change-password`, {
    method: 'POST',
    body: JSON.stringify(passwords),
  });
};