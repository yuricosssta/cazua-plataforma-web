//src/lib/redux/slices/resourcesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { resourceService, ProjectStatement } from '../../services/resourceService';
import { AllocateResourceData } from '../../services/resourceService';

interface ResourcesState {
  statement: ProjectStatement | null;
  loading: boolean;
  error: string | null;
}

const initialState: ResourcesState = {
  statement: null,
  loading: false,
  error: null,
};

export const fetchProjectStatement = createAsyncThunk(
  'resources/fetchProjectStatement',
  async ({ orgId, projectId }: { orgId: string; projectId: string }, { rejectWithValue }) => {
    try {
      return await resourceService.getProjectStatement(orgId, projectId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao carregar o extrato de custos do projeto.'
      );
    }
  }
);

export const returnResourceThunk = createAsyncThunk(
  'resources/returnResource',
  async ({ orgId, projectId, data }: { orgId: string; projectId: string; data: AllocateResourceData }, { rejectWithValue }) => {
    try {
      return await resourceService.returnFromProject(orgId, projectId, data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao processar a devolução do recurso.'
      );
    }
  }
);

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    clearStatement: (state) => {
      state.statement = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectStatement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectStatement.fulfilled, (state, action: PayloadAction<ProjectStatement>) => {
        state.loading = false;
        state.statement = action.payload;
      })
      .addCase(fetchProjectStatement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearStatement } = resourcesSlice.actions;
export default resourcesSlice.reducer;