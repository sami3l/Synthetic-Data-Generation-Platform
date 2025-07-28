// hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { login, logout, register } from '../features/auth/authSlice';
import { RootState, AppDispatch } from '../store/';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const handleLogin = async (email: string, password: string) => {
    try {
      await (dispatch(login({ email, password })) as any).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleRegister = async (email: string, password: string, username?: string) => {
    try {
      await dispatch(register({ email, password, username })).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
  };
};