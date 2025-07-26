import { Tabs } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from '../store';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0a7ea4',
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home' }} />
        <Tabs.Screen name="requests" options={{ title: 'Requests' }} />
        <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
      </Tabs>
    </Provider>
  );
}