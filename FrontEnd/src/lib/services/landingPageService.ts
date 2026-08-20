//src/lib/services/landingPageService.ts
export const landingPageService = {
  async getConfig(organizationId: string) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Sessão expirada. Token ausente.');

    const response = await fetch('/api/landing-pages/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-org-id': organizationId,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao recuperar configurações da landing page.');
    }

    return data;
  },

  async upsertConfig(organizationId: string, payload: any) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Sessão expirada. Token ausente.');

    const response = await fetch('/api/landing-pages/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-org-id': organizationId,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao salvar as configurações. O domínio pode já estar em uso.');
    }

    return data;
  },
};