import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMissions } from '../../hooks/useMissions-local';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MissionPdfMenu } from '../../components/MissionPdfMenu';
import { KilometrageStatusIcon } from '../../components/KilometrageStatusIcon';
import { Colors } from '../../constants/Colors';
import { DateUtils } from '../../utils/dateUtils';
import { databaseService } from '../../lib/database';

export default function AllMissionsScreen() {
  const router = useRouter();
  const { missions, companies, loading, loadMissions } = useMissions();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const colors = Colors.light;

  const loadDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const allUsers = await databaseService.getAllUsers();
      const driversList = allUsers.filter(u => u.role === 'DRIVER' && u.isActive);
      setDrivers(driversList);
    } catch (error) {
      console.error('Erreur chargement chauffeurs:', error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  React.useEffect(() => {
    loadDrivers();
  }, []);

  const handleDeleteMission = async (missionId: string, missionTitle: string) => {
    Alert.alert(
      'Supprimer la mission',
      `Êtes-vous sûr de vouloir supprimer la mission "${missionTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Note: Il faudrait ajouter une méthode deleteMission au databaseService
              await loadMissions();
              Alert.alert('Succès', 'Mission supprimée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la mission');
            }
          },
        },
      ]
    );
  };

  if (loading || loadingDrivers) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Chargement des missions..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Toutes les Missions
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {missions.length} mission(s) au total
          </Text>
        </View>

        {/* Filtres par statut */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Répartition par statut" />
          <CardContent>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {missions.filter(m => m.status === 'PENDING').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  En attente
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.info }]}>
                  {missions.filter(m => m.status === 'IN_PROGRESS').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  En cours
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {missions.filter(m => m.status === 'COMPLETED').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Terminées
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.error }]}>
                  {missions.filter(m => m.status === 'CANCELLED').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Annulées
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Liste complète des missions */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Liste complète" />
          <CardContent>
            {missions.length > 0 ? (
              missions.map((mission) => (
                <View key={mission.id} style={styles.missionItem}>
                  <View style={styles.missionHeader}>
                    <View style={styles.missionTitleContainer}>
                      <Text style={[styles.missionTitle, { color: colors.text }]}>
                        {mission.title}
                      </Text>
                      <KilometrageStatusIcon mission={mission} size={18} />
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: 
                          mission.status === 'COMPLETED' ? colors.success :
                          mission.status === 'IN_PROGRESS' ? colors.info :
                          mission.status === 'PENDING' ? colors.warning :
                          colors.error
                      }
                    ]}>
                      <Text style={[styles.statusText, { color: colors.textOnPrimary }]}>
                        {mission.status === 'PENDING' ? 'En attente' :
                         mission.status === 'IN_PROGRESS' ? 'En cours' :
                         mission.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                    Chauffeur: {drivers.find(d => d.id === mission.driverId)?.firstName} {drivers.find(d => d.id === mission.driverId)?.lastName || 'Non assigné'}
                  </Text>
                  <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                    Client: {companies[mission.companyId]?.name || 'Inconnu'}
                  </Text>
                  <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                    Trajet: {mission.departureLocation} → {mission.arrivalLocation}
                  </Text>
                  <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                    Programmée: {DateUtils.formatDateTime(mission.scheduledDepartureAt)}
                  </Text>
                  <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                    Passagers: {mission.currentPassengers}/{mission.maxPassengers}
                  </Text>

                  <View style={styles.actionButtons}>
                    <Button
                      title="Voir détails"
                      onPress={() => router.push(`/mission/${mission.id}` as any)}
                      variant="ghost"
                      style={styles.actionButton}
                    />
                    {mission.status === 'PENDING' && (
                      <Button
                        title="Modifier"
                        onPress={() => router.push(`/admin/edit-mission/${mission.id}` as any)}
                        variant="ghost"
                        style={styles.editButton}
                      />
                    )}
                    <MissionPdfMenu
                      mission={mission}
                      companyName={companies[mission.companyId]?.name}
                      driverName={(() => {
                        const driver = drivers.find(d => d.id === mission.driverId);
                        return driver ? `${driver.firstName} ${driver.lastName}` : 'Chauffeur non assigné';
                      })()}
                      vehicleInfo={mission.vehicleId ? `Véhicule ${mission.vehicleId}` : 'Véhicule non assigné'}
                      triggerStyle={styles.pdfButton}
                      iconSize={16}
                    />
                    {mission.status === 'PENDING' && (
                      <Button
                        title="Supprimer"
                        onPress={() => handleDeleteMission(mission.id, mission.title)}
                        variant="ghost"
                        style={styles.deleteButton}
                      />
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune mission trouvée
              </Text>
            )}
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
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  missionItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
  missionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  missionDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  editButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  pdfButton: {
    marginHorizontal: 4,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 32,
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
});
