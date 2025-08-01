import { useRouter } from 'expo-router';
import React from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { MissionCard } from '../../components/MissionCard-local';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth-local';
import { useMissions } from '../../hooks/useMissions-local';
import { DateUtils } from '../../utils/dateUtils';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { missions, companies, loading, loadMissions } = useMissions();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMissions} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour, {user?.firstName} 👋
          </Text>
          <Text style={styles.subtitle}>
            Voici votre tableau de bord
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {missions.filter(m => m.status === 'COMPLETED').length}
            </Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {missions.filter(m => m.status === 'IN_PROGRESS').length}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {missions.filter(m => m.status === 'PENDING').length}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>

        <View style={styles.missionsList}>
          <Text style={styles.sectionTitle}>Missions récentes</Text>
          {missions.slice(0, 5).map((mission) => (
            <View key={mission.id} style={styles.missionItem}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <Text style={styles.missionCompany}>
                {companies[mission.companyId]?.name || 'Entreprise inconnue'}
              </Text>
              <Text style={styles.missionStatus}>{mission.status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  missionsList: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  missionItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  missionCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  missionStatus: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});

