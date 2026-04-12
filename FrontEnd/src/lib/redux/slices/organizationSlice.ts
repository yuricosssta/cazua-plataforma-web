// src/lib/redux/slices/organizationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { apiFetchMyOrganizations } from '@/lib/api/organizationService';
import { IOrgSettings, IMembership } from '@/types/organization';

interface OrganizationState {
  list: IMembership[];
  currentOrganization: IMembership | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isCreateOrgModalOpen: boolean;
}

const initialState: OrganizationState = {
  list: [],
  currentOrganization: null,
  status: 'idle',
  error: null,
  isCreateOrgModalOpen: false,
};

export const fetchMyOrganizations = createAsyncThunk(
  'organizations/fetchMyOrgs',
  async (_, { getState, rejectWithValue }) => {
    try {
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
    setCreateOrgModalOpen(state, action: PayloadAction<boolean>) {
      if (state.list.length === 0) {
        state.isCreateOrgModalOpen = action.payload;
      }
    },

    setCurrentOrganization(state, action: PayloadAction<string>) {
      const selected = state.list.find(item => item.organizationId._id === action.payload);
      if (selected) {
        state.currentOrganization = selected;
        localStorage.setItem('last_org_id', selected.organizationId._id);
      }
    },

    updateCurrentOrgSettings(state, action: PayloadAction<IOrgSettings>) {
      if (state.currentOrganization && state.currentOrganization.organizationId) {
        state.currentOrganization.organizationId.settings = action.payload;
        
        // Atualiza também na lista para manter tudo sincronizado
        const index = state.list.findIndex(o => o.organizationId._id === state.currentOrganization!.organizationId._id);
        if (index !== -1) {
          state.list[index].organizationId.settings = action.payload;
        }
      }
    },

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

        if (state.list.length > 0 && !state.currentOrganization) {
          const lastOrgId = localStorage.getItem('last_org_id');
          const savedOrg = state.list.find(o => o.organizationId._id === lastOrgId);

          if (savedOrg) {
            state.currentOrganization = savedOrg;
          } else {
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

export const { 
  setCurrentOrganization, 
  clearOrganizationState, 
  updateCurrentOrgSettings
} = organizationSlice.actions;

export const selectAllOrgs = (state: RootState) => state.organizations.list;
export const selectCurrentOrg = (state: RootState) => state.organizations.currentOrganization;
export const selectOrgStatus = (state: RootState) => state.organizations.status;

export default organizationSlice.reducer;