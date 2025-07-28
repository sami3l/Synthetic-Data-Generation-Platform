import { Stack } from 'expo-router';
import React from 'react';
import '../global.css';
import { Provider } from 'react-redux';
import { store } from '../store/index'; // Adjust this path to your actual store file


export default function RootLayout() {
  return (
      <Provider store={store}>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{headerShown: false  }} />
      <Stack.Screen name="requests" options={{ headerShown: false  }} />
      
    </Stack>
    </Provider>
  );
}

