
import { Stack } from 'expo-router';
import { Provider } from 'react-native-paper';

export default function ProfileLayout() {
  return (
    <Provider theme={ 
      {
      }
    }>
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen 
        name="datasets" 
        options={{
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="edit-dataset" 
        options={{
          headerShown: false,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="replace-dataset" 
        options={{
          headerShown: false,
          presentation: 'card',
        }} 
      />
    </Stack>
    </Provider>
  );
}