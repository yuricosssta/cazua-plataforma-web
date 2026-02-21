// FrontEnd/src/lib/redux/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';
import { jwtDecode } from 'jwt-decode';

interface UserPayload {
  sub: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthResponse {
  access_token: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserPayload | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null | undefined;
  sessionExpired: boolean;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  user: null,
  status: 'idle',
  error: null,
  sessionExpired: false,
};

// Função auxiliar para decodificar com segurança
const safeDecode = (token: string): UserPayload | null => {
  try {
    const decoded = jwtDecode<UserPayload>(token);

    // DEBUG: Veja no console o que realmente tem no seu token
    console.log("Token Decodificado (Payload):", decoded);

    // FALLBACK: Se o backend não mandou 'name', usa a parte do email antes do @
    if (!decoded.name && decoded.email) {
      decoded.name = decoded.email.split('@')[0];
    }

    return decoded;
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    return null;
  }
};

export const loginUser = createAsyncThunk<AuthResponse, { email: string; password: string }>(
  'auth/loginUser', //nome da ação
  async (credentials) => {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, credentials);
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // setAuthState: (state, action: PayloadAction<{ token: string | null; isAuthenticated: boolean }>) => {
    setAuthState: (state, action: PayloadAction<{ token: string | null }>) => {
      const token = action.payload.token;
      // state.isAuthenticated = action.payload.isAuthenticated;
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        state.user = safeDecode(token);
      } else {
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      }
    },

    logout: (state) => {
      localStorage.removeItem('token');
      return initialState;
    },

    sessionExpired: (state) => {
      state.sessionExpired = true;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        const token = action.payload.access_token;
        state.status = 'succeeded';
        state.token = token;
        state.isAuthenticated = true;
        localStorage.setItem('token', token); // Armazena o token no localStorage
        state.user = safeDecode(token);
        // state.user = jwtDecode<UserPayload>(token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        console.error('Erro ao fazer login:', action.error.message);
      });
  },
});

export const { setAuthState, logout, sessionExpired } = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectSessionExpired = (state: RootState) => state.auth.sessionExpired;

export default authSlice.reducer;


