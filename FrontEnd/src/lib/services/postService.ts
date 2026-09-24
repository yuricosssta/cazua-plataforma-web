// src/lib/services/postService.ts
import { fetchBff, getAuthHeaders } from '@/lib/api/fetchBff';
import { IPost } from '@/types/post';

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

export const postService = {
  getPosts: async (page: number, limit: number = 10, term?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (term) params.append('term', term);
    
    const orgHeaders = await getOrgHeaders();
    return fetchBff<{ data: IPost[]; total: number; page: number; limit: number; totalPages: number }>(`/api/posts?${params.toString()}`, {
      headers: orgHeaders,
    });
  },

  getPostById: async (id: string) => {
    const orgHeaders = await getOrgHeaders();
    return fetchBff<IPost>(`/api/posts/${id}`, {
      headers: orgHeaders,
    });
  },

  createPost: async (data: Omit<IPost, 'id'>) => {
    const orgHeaders = await getOrgHeaders();
    return fetchBff<IPost>('/api/posts', {
      method: 'POST',
      headers: orgHeaders,
      body: JSON.stringify(data),
    });
  },

  updatePost: async (id: string, data: Partial<IPost>) => {
    const orgHeaders = await getOrgHeaders();
    return fetchBff<IPost>(`/api/posts/${id}`, {
      method: 'PUT',
      headers: orgHeaders,
      body: JSON.stringify(data),
    });
  },
  
  deletePost: async (id: string) => {
    const orgHeaders = await getOrgHeaders();
    return fetchBff<void>(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: orgHeaders,
    });
  }
};