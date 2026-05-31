// src/lib/redux/slices/planningSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import planningService, {
  SearchResponse,
  CompositionDetail,
  UploadResponse,
  SearchPlanningQuery,
  UploadPlanningPayload,
  CompositionItem,
} from '../../services/planningService';

interface PlanningState {
  // Busca de composições
  searchResults: SearchResponse | null;
  searchLoading: boolean;
  searchError: string | null;

  // Detalhe de composição
  compositionDetail: CompositionDetail | null;
  compositionLoading: boolean;
  compositionError: string | null;

  // Upload
  uploadLoading: boolean;
  uploadError: string | null;
  uploadSuccess: boolean;

  // Agrupamento
  groupedData: any | null;
  groupedLoading: boolean;
  groupedError: string | null;
}

const initialState: PlanningState = {
  searchResults: null,
  searchLoading: false,
  searchError: null,

  compositionDetail: null,
  compositionLoading: false,
  compositionError: null,

  uploadLoading: false,
  uploadError: null,
  uploadSuccess: false,

  groupedData: null,
  groupedLoading: false,
  groupedError: null,
};

// --- THUNKS ---

export const searchCompositions = createAsyncThunk(
  'planning/searchCompositions',
  async (query: SearchPlanningQuery, { rejectWithValue }) => {
    try {
      return await planningService.search(query);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao buscar composições.'
      );
    }
  }
);

export const getCompositionDetail = createAsyncThunk(
  'planning/getCompositionDetail',
  async (
    { codigoComposicao, query }: { codigoComposicao: string; query?: Omit<SearchPlanningQuery, 'codigoComposicao'> },
    { rejectWithValue }
  ) => {
    try {
      return await planningService.getCompositionItems(codigoComposicao, query);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao carregar detalhe da composição.'
      );
    }
  }
);

export const uploadExcelFile = createAsyncThunk(
  'planning/uploadExcelFile',
  async (
    { file, metadata }: { file: File; metadata: UploadPlanningPayload },
    { rejectWithValue }
  ) => {
    try {
      return await planningService.uploadFromExcel(file, metadata);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao fazer upload do arquivo.'
      );
    }
  }
);

export const getGroupedData = createAsyncThunk(
  'planning/getGroupedData',
  async (query: SearchPlanningQuery, { rejectWithValue }) => {
    try {
      return await planningService.grouped(query);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Falha ao agrupar dados.'
      );
    }
  }
);

// --- SLICE ---
const planningSlice = createSlice({
  name: 'planning',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = null;
      state.searchError = null;
    },
    clearCompositionDetail: (state) => {
      state.compositionDetail = null;
      state.compositionError = null;
    },
    clearUploadState: (state) => {
      state.uploadError = null;
      state.uploadSuccess = false;
    },
    clearGroupedData: (state) => {
      state.groupedData = null;
      state.groupedError = null;
    },
  },
  extraReducers: (builder) => {
    // Busca de composições
    builder
      .addCase(searchCompositions.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(
        searchCompositions.fulfilled,
        (state, action: PayloadAction<SearchResponse>) => {
          state.searchLoading = false;
          state.searchResults = action.payload;
        }
      )
      .addCase(searchCompositions.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload as string;
      });

    // Detalhe de composição
    builder
      .addCase(getCompositionDetail.pending, (state) => {
        state.compositionLoading = true;
        state.compositionError = null;
      })
      .addCase(
        getCompositionDetail.fulfilled,
        (state, action: PayloadAction<CompositionDetail>) => {
          state.compositionLoading = false;
          state.compositionDetail = action.payload;
        }
      )
      .addCase(getCompositionDetail.rejected, (state, action) => {
        state.compositionLoading = false;
        state.compositionError = action.payload as string;
      });

    // Upload
    builder
      .addCase(uploadExcelFile.pending, (state) => {
        state.uploadLoading = true;
        state.uploadError = null;
        state.uploadSuccess = false;
      })
      .addCase(
        uploadExcelFile.fulfilled,
        (state, action: PayloadAction<UploadResponse>) => {
          state.uploadLoading = false;
          state.uploadSuccess = true;
          state.uploadError = null;
        }
      )
      .addCase(uploadExcelFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.uploadError = action.payload as string;
        state.uploadSuccess = false;
      });

    // Agrupamento
    builder
      .addCase(getGroupedData.pending, (state) => {
        state.groupedLoading = true;
        state.groupedError = null;
      })
      .addCase(getGroupedData.fulfilled, (state, action: PayloadAction<any>) => {
        state.groupedLoading = false;
        state.groupedData = action.payload;
      })
      .addCase(getGroupedData.rejected, (state, action) => {
        state.groupedLoading = false;
        state.groupedError = action.payload as string;
      });
  },
});

export const {
  clearSearchResults,
  clearCompositionDetail,
  clearUploadState,
  clearGroupedData,
} = planningSlice.actions;

export default planningSlice.reducer;
