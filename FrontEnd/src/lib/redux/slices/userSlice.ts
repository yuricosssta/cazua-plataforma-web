//src/lib/redux/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/lib/api/axiosInstance';
import { IUser } from '../../../types/user';
import { logout, sessionExpired } from './authSlice'; 

interface UserState {
  users: IUser[] | null;
  profile: IUser | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserState = {
  users: null,
  profile: null,
  status: 'idle',
  error: null,
};

export const fetchUserProfile = createAsyncThunk<IUser>(
  'user/fetchProfile',
  async () => {
    const response = await axiosInstance.get('/users/profile');
    return response.data;
  }
);

export const fetchUsers = createAsyncThunk<IUser[]>(
  'user/fetchUsers',
  async () => {
    const response = await axiosInstance.get('/users');
    return response.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // actions manuais aqui
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<IUser>) => {
        state.status = 'succeeded';
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Falha ao buscar perfil.';
      })
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<IUser[]>) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Falha ao buscar usuários.';
      })
      .addCase(logout, () => {
        return initialState;
      })
      .addCase(sessionExpired, () => {
        return initialState;
      });
  },
});

export default userSlice.reducer;