// src/lib/redux/slices/organizationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { apiFetchMyOrganizations } from '@/lib/api/organizationService';

// 1. Interfaces
export interface IOrganization {
  _id: string; // ID do vínculo (Membership)
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  organizationId: {
    _id: string;
    name: string;
    slug: string;
  };
}

interface OrganizationState {
  list: IOrganization[];
  currentOrganization: IOrganization | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: OrganizationState = {
  list: [],
  currentOrganization: null,
  status: 'idle',
  error: null,
};

export const fetchMyOrganizations = createAsyncThunk(
  'organizations/fetchMyOrgs',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Pega o token direto do estado do Redux (AuthSlice)
      const state = getState() as RootState;
      const token = state.auth.token; 

      if (!token) {
        return rejectWithValue('Usuário não autenticado');
      }

      const data = await apiFetchMyOrganizations(token); 
      return data;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);


const organizationSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    // Ação para trocar de empresa manualmente (Dropdown)
    setCurrentOrganization(state, action: PayloadAction<string>) {
      const selected = state.list.find(item => item.organizationId._id === action.payload);
      if (selected) {
        state.currentOrganization = selected;
        // Salva no localStorage para persistir ao dar F5
        localStorage.setItem('last_org_id', selected.organizationId._id);
      }
    },
    // Ação para limpar estado ao fazer Logout
    clearOrganizationState(state) {
      state.list = [];
      state.currentOrganization = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('last_org_id');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrganizations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyOrganizations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;

        // Se a lista não está vazia e não temos atual selecionada, seleciona a primeira.
        if (state.list.length > 0 && !state.currentOrganization) {          
          // Tenta recuperar do localStorage (se o user deu F5)
          const lastOrgId = localStorage.getItem('last_org_id');
          const savedOrg = state.list.find(o => o.organizationId._id === lastOrgId);

          if (savedOrg) {
            state.currentOrganization = savedOrg;
          } else {
            // Se não tiver salvo, pega a primeira da lista
            state.currentOrganization = state.list[0];
            localStorage.setItem('last_org_id', state.list[0].organizationId._id);
          }
        }
      })
      .addCase(fetchMyOrganizations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentOrganization, clearOrganizationState } = organizationSlice.actions;

// Seletores úteis
export const selectAllOrgs = (state: RootState) => state.organizations.list;
export const selectCurrentOrg = (state: RootState) => state.organizations.currentOrganization;
export const selectOrgStatus = (state: RootState) => state.organizations.status;

export default organizationSlice.reducer;