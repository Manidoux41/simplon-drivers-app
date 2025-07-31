import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useMissions } from '../../hooks/useMissions-local';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../constants/Colors';
import { DateUtils } from '../../utils/dateUtils';

export default function HistoryScreen() {
  const { missions, companies, loading } = useMissions();
  const colors = Colors.light;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Chargement de l'historique..." />
      </SafeAreaView>
    );
  }

  const completedMissions = missions.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Historique
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {completedMissions.length} mission(s) terminée(s)
          </Text>
        </View>

        {completedMissions.length > 0 ? (
          completedMissions.map((mission) => (
            <Card key={mission.id} variant="elevated" style={styles.missionCard}>
              <CardContent>
                <View style={styles.missionHeader}>
                  <Text style={[styles.missionTitle, { color: colors.text }]}>
                    {mission.title}
                  </Text>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: mission.status === 'COMPLETED' ? colors.success : colors.error }
                  ]}>
                    <Text style={[styles.statusText, { color: colors.textOnPrimary }]}>
                      {mission.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.missionDetails, { color: colors.textSecondary }]}>
                  Client: {companies[mission.companyId]?.name || 'Inconnu'}
                </Text>
                <Text style={[styles.missionDetails, { color: colors.textSecondary }]}>
                  De: {mission.departureLocation}
                </Text>
                <Text style={[styles.missionDetails, { color: colors.textSecondary }]}>
                  Vers: {mission.arrivalLocation}
                </Text>
                <Text style={[styles.missionDetails, { color: colors.textSecondary }]}>
                  Date: {DateUtils.formatDate(mission.scheduledDepartureAt)}
                </Text>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card variant="elevated" style={styles.emptyCard}>
            <CardContent>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune mission dans l'historique
              </Text>
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  missionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  missionDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
