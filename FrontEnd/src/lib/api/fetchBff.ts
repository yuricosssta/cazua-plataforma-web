// src/lib/api/fetchBff.ts
// Helper client-side para chamar as BFF routes com tratamento de erro compatível com axios

export async function fetchBff<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(data.message || `Erro ${res.status}`);
    error.response = { data, status: res.status };
    throw error;
  }

  return data as T;
}