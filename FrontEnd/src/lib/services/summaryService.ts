//src/lib/services/summaryService.ts
import { fetchBff, getAuthHeaders } from '@/lib/api/fetchBff';
import { CreateReelDto } from '@/validations/summary.zod';

const NEST_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper to get org headers from Redux store (async import to avoid circular deps)
async function getOrgHeaders(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') return {};
  try {
    const { store } = await import('@/lib/redux/store');
    const state = store.getState();
    const currentOrg = state.organizations?.currentOrganization;
    if (currentOrg && currentOrg.organizationId) {
      const orgId = typeof currentOrg.organizationId === 'string'
        ? currentOrg.organizationId
        : currentOrg.organizationId._id || currentOrg.organizationId.id;
      if (!orgId) return {};
      return {
        'x-org-id': orgId,
        'x-org-role': currentOrg.role,
      };
    }
  } catch {}
  return {};
}

export const summaryService = {
  async summarizeText(text: string): Promise<string> {
    try {
      const orgHeaders = await getOrgHeaders();
      const response = await fetch(`${NEST_API_URL}/summary/text`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), ...orgHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Não foi possível gerar o resumo.');
      }

      return response.text();
    } catch (error: any) {
      throw new Error(error.message || 'Não foi possível gerar o resumo. Entre em contato com o suporte se persistir.');
    }
  },

  async generateReel(data: CreateReelDto): Promise<string> {
    try {
      const orgHeaders = await getOrgHeaders();
      const response = await fetch(`${NEST_API_URL}/summary/reels/generate`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), ...orgHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao gerar o conteúdo de publicidade.');
      }

      return response.text();
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao gerar o conteúdo de publicidade.');
    }
  }
};