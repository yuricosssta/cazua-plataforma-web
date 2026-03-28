// src/lib/api/axiosInstance.ts
import axios from 'axios';
import { Console } from 'console';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const { store } = await import('@/lib/redux/store');
    const state = store.getState();
    const token = state.auth.token;
    const currentOrg = state.organizations.currentOrganization;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (currentOrg && currentOrg.organizationId) {
      config.headers['x-org-id'] = currentOrg.organizationId._id;
    }

    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { store } = await import('@/lib/redux/store');
      const { sessionExpired } = await import('@/lib/redux/slices/authSlice');
      const { clearOrganizationState } = await import('@/lib/redux/slices/organizationSlice');
      store.dispatch(clearOrganizationState());
      store.dispatch(sessionExpired());
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;