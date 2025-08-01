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
  const { missions, companies, loading, onRefresh } = useMissions();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
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
              {missions.filter(m => m.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Terminées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {missions.filter(m => m.status === 'in_progress').length}
            </Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {missions.filter(m => m.status === 'pending').length}
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

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    missions,
    companies,
    loading,
    error,
    loadMissions,
    updateMissionStatus,
    getTodayMissions,
    getInProgressMissions,
    getUpcomingMissions,
  } = useMissions();

  const colors = Colors.light;
  const currentMission = getInProgressMissions()[0] || null;
  const todaysMissions = getTodayMissions();
  const upcomingMissions = getUpcomingMissions().slice(0, 3); // Prochaines 3 missions

  const onRefresh = React.useCallback(() => {
    loadMissions();
  }, []);

  const handleMissionPress = (missionId: string) => {
    router.push(`/mission/${missionId}`);
  };

  const handleUpdateMissionStatus = async (missionId: string, status: string) => {
    try {
      await updateMissionStatus(missionId, status);
    } catch (error) {
      console.error('Error updating mission status:', error);
    }
  };

  if (loading && missions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Chargement du tableau de bord..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {/* En-tête de bienvenue */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Bonjour {user?.firstName} !
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {DateUtils.formatDate(new Date())}
          </Text>
        </View>

        {/* Mission en cours */}
        {currentMission && (
          <Card variant="elevated" style={styles.currentMissionCard}>
            <CardHeader
              title="Mission en cours"
              titleStyle={{ ...styles.sectionTitle, color: colors.primary }}
            />
            <CardContent>
              <MissionCard
                mission={currentMission}
                company={companies[currentMission.companyId]}
                onPress={() => handleMissionPress(currentMission.id)}
              />
            </CardContent>
          </Card>
        )}

        {/* Missions d'aujourd'hui */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader
            title="Missions d'aujourd'hui"
            subtitle={`${todaysMissions.length} mission${todaysMissions.length > 1 ? 's' : ''}`}
            action={
              <Button
                title="Voir tout"
                variant="ghost"
                size="small"
                onPress={() => router.push('/(tabs)/missions')}
              />
            }
          />
          <CardContent>
            {todaysMissions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucune mission prévue aujourd'hui
                </Text>
              </View>
            ) : (
              <View>
                {todaysMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    company={companies[mission.companyId]}
                    onPress={() => handleMissionPress(mission.id)}
                    compact={true}
                  />
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* Prochaines missions */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader
            title="Prochaines missions"
            subtitle={`${upcomingMissions.length} mission${upcomingMissions.length > 1 ? 's' : ''} à venir`}
            action={
              <Button
                title="Voir tout"
                variant="ghost"
                size="small"
                onPress={() => router.push('/(tabs)/missions')}
              />
            }
          />
          <CardContent>
            {upcomingMissions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucune mission prévue
                </Text>
              </View>
            ) : (
              <View>
                {upcomingMissions.map((mission) => (
                  <View key={mission.id} style={styles.upcomingMissionItem}>
                    <View style={styles.upcomingMissionInfo}>
                      <Text style={[styles.upcomingMissionTitle, { color: colors.text }]}>
                        {mission.title}
                      </Text>
                      <Text style={[styles.upcomingMissionSubtitle, { color: colors.textSecondary }]}>
                        {companies[mission.companyId]?.name || 'Entreprise inconnue'}
                      </Text>
                      <Text style={[styles.upcomingMissionDate, { color: colors.primary }]}>
                        {DateUtils.getRelativeDate(mission.scheduledDepartureAt)} à{' '}
                        {DateUtils.formatTime(mission.scheduledDepartureAt)}
                      </Text>
                    </View>
                    <Button
                      title="Détails"
                      variant="outline"
                      size="small"
                      onPress={() => handleMissionPress(mission.id)}
                    />
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* Statistiques rapides */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Statistiques" />
          <CardContent>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {missions.filter(m => m.status === 'COMPLETED').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Terminées
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.warning }]}>
                  {missions.filter(m => m.status === 'PENDING').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  En attente
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.success }]}>
                  {missions.filter(m => m.status === 'IN_PROGRESS').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  En cours
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {error && (
          <Card variant="outlined" style={{ ...styles.errorCard, borderColor: colors.error }}>
            <CardContent>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
              <Button
                title="Réessayer"
                variant="outline"
                size="small"
                onPress={onRefresh}
                style={styles.retryButton}
              />
            </CardContent>
          </Card>
        )}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
  },
  currentMissionCard: {
    marginBottom: 16,
    backgroundColor: Colors.light.primaryLight + '10',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  upcomingMissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  upcomingMissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  upcomingMissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  upcomingMissionSubtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  upcomingMissionDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  errorCard: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'center',
  },
});
