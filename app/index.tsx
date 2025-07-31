import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth-local';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Logo } from '../components/ui/Logo';
import { Colors } from '../constants/Colors';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const colors = Colors.light;

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)/' as any);
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading, router]);

  // Écran de chargement avec le logo Simplon
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.logoContainer}>
        <Logo size="large" showText={false} />
        
        <Text style={[styles.appName, { color: colors.primary }]}>
          Simplon Drivers
        </Text>
        
        <Text style={[styles.companyName, { color: colors.textSecondary }]}>
          Plateforme de transport professionnelle
        </Text>
      </View>

      <View style={styles.loadingContainer}>
        <LoadingSpinner 
          color={colors.primary}
          text="Chargement..."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  companyName: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
  },
});
