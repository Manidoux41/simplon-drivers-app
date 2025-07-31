import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useMissions } from '../../hooks/useMissions-local';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MissionCard } from '../../components/MissionCard-local';
import { Colors } from '../../constants/Colors';

export default function MissionsScreen() {
  const router = useRouter();
  const { missions, companies, loading } = useMissions();
  const colors = Colors.light;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Chargement des missions..." />
      </SafeAreaView>
    );
  }

  const activeMissions = missions.filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Mes Missions
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {activeMissions.length} mission(s) active(s)
          </Text>
        </View>

        {activeMissions.length > 0 ? (
          activeMissions.map((mission) => (
            <Card key={mission.id} variant="elevated" style={styles.missionCard}>
              <CardContent>
                <MissionCard
                  mission={mission}
                  company={companies[mission.companyId]}
                  onPress={() => router.push(`/mission/${mission.id}` as any)}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <Card variant="elevated" style={styles.emptyCard}>
            <CardContent>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune mission active pour le moment
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
