// store/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: any | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; user: any }>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.token;
      state.user = action.payload.user;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;