import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth-local';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { WorkTimeStats } from '../../components/WorkTimeStats';
import { Colors } from '../../constants/Colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colors = Colors.light;

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Rediriger vers la page de connexion après déconnexion
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Mon Profil
          </Text>
        </View>

        {/* Informations personnelles */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Informations personnelles" />
          <CardContent>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nom complet</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.email}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Numéro de permis</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.licenseNumber}
              </Text>
            </View>
            
            {user?.phoneNumber && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Téléphone</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {user.phoneNumber}
                </Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Rôle</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.role === 'ADMIN' ? 'Administrateur' : 'Chauffeur'}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Statistiques de temps de travail (pour les chauffeurs uniquement) */}
        {user?.role === 'DRIVER' && (
          <Card variant="elevated" style={styles.section}>
            <CardHeader title="Mes temps de travail" />
            <CardContent>
              <WorkTimeStats driverId={user.id.toString()} currentUser={user} />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Actions" />
          <CardContent>
            <Button
              title="Se déconnecter"
              onPress={handleLogout}
              variant="secondary"
              style={styles.logoutButton}
            />
          </CardContent>
        </Card>

        {/* Version */}
        <Card variant="elevated" style={styles.section}>
          <CardContent>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              Cars Simplon Drivers App
            </Text>
            <Text style={[styles.versionText, { color: colors.textSecondary }]}>
              Version 1.0.0 - SQLite
            </Text>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
});
