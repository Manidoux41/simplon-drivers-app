import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../hooks/useAuth-local';
import { Colors } from '../../constants/Colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const colors = Colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Tableau de bord
        </Text>
        <Text style={[styles.welcome, { color: colors.textSecondary }]}>
          Bienvenue {user?.firstName || 'Chauffeur'}!
        </Text>
        <Text style={[styles.status, { color: colors.success }]}>
          ✅ Connexion réussie avec SQLite
        </Text>
        <Text style={[styles.info, { color: colors.textSecondary }]}>
          Le système est maintenant opérationnel avec la base de données locale.
        </Text>
        <Text style={[styles.debug, { color: colors.primary }]}>
          Email: {user?.email}
        </Text>
        <Text style={[styles.debug, { color: colors.primary }]}>
          Rôle: {user?.role}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  debug: {
    fontSize: 12,
    marginBottom: 5,
  },
});
