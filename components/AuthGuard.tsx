import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth-local';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // Utilisateur non connecté et pas dans le groupe auth -> rediriger vers login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Utilisateur connecté et dans le groupe auth -> rediriger vers tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments, router]);

  return <>{children}</>;
}
