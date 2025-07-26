import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import requestReducer from '../features/requests/requestSlice';
import notificationReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    requests: requestReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

