// src/lib/api/fetchBff.ts
// Helper client-side para chamar as BFF routes com auth + tratamento de erro compatível com axios

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function fetchBff<T = any>(url: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;

  const headers = new Headers(options?.headers);

  // Injeta token de autenticação (lê do localStorage, compatível com o padrão legado)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Content-Type automático apenas para JSON; FormData o browser define com boundary
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error: any = new Error(data.message || data.error || `Erro ${res.status}`);
    error.response = { data, status: res.status };
    throw error;
  }

  return data as T;
}