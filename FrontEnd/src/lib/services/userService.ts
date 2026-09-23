// src/lib/services/userService.ts
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

export const apiUpdateProfile = async (userId: string, name: string) => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
};

export const apiChangePassword = async (passwords: any) => {
  const res = await fetch(`${BASE_URL}/users/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwords),
  });
  return handleResponse(res);
};