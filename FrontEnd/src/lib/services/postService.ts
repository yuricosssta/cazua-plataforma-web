// src/lib/services/postService.ts
import axios from 'axios';
import { IPost } from '@/types/post';

const localClient = axios.create({ baseURL: '/api' });

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