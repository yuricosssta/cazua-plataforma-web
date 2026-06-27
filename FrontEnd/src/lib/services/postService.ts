// src/lib/services/postService.ts
import axios from 'axios';
import { IPost } from '@/types/post';

const localClient = axios.create({ baseURL: '/api' });

// Interceptor para plugar os cabeçalhos da organização nas chamadas ao BFF
localClient.interceptors.request.use(
  async (config) => {
    const { store } = await import('@/lib/redux/store');
    const state = store.getState();
    const token = state.auth?.token;
    const currentOrg = state.organizations?.currentOrganization;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (currentOrg && currentOrg.organizationId) {
      // Trata a estrutura independentemente de estar populada ou apenas como string
      const orgId = typeof currentOrg.organizationId === 'string'
        ? currentOrg.organizationId
        : currentOrg.organizationId._id || currentOrg.organizationId.id;

      config.headers['x-org-id'] = orgId;
      config.headers['x-org-role'] = currentOrg.role;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const postService = {
  getPosts: async (page: number, limit: number = 10) => {
    const response = await localClient.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },
  getPostById: async (id: string) => {
    const response = await localClient.get(`/posts/${id}`);
    return response.data;
  },
  createPost: async (data: Omit<IPost, 'id'>) => {
    const response = await localClient.post('/posts', data);
    return response.data;
  },
  updatePost: async (id: string, data: Partial<IPost>) => {
    const response = await localClient.put(`/posts/${id}`, data);
    return response.data;
  },
  deletePost: async (id: string) => {
    const response = await localClient.delete(`/posts/${id}`);
    return response.data;
  }
};