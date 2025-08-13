// app/_layout.tsx
import { useEffect } from 'react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [user, segments, router]);

  return <Slot />;
}