import { Slot, useSegments, useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { user, isInitialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  // Wait until auth is initialized
  if (!isInitialized) return null; // prevents layout effects from firing too early

  // Redirect logic
  const inAuthGroup = segments[0] === '(auth)';
  if (!user && !inAuthGroup && pathname !== '/login') {
    router.replace('/login');
    return null; // stop rendering Slot until redirect
  } else if (user && inAuthGroup && pathname !== '/(tabs)/home') {
    router.replace('/(tabs)/home');
    return null;
  }

  return <Slot />; 
}
