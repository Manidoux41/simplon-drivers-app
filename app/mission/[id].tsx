import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMissions } from '../../hooks/useMissions-local';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RouteMap } from '../../components/RouteMap';
import { RouteNavigationButtons } from '../../components/RouteNavigationButtons';
import { Colors } from '../../constants/Colors';
import { DateUtils } from '../../utils/dateUtils';
import { MapUtils } from '../../utils/mapUtils';
import { Mission } from '../../lib/database';

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams();
  const { missions, companies, updateMissionStatus, loading } = useMissions();
  const [mission, setMission] = useState<Mission | null>(null);
  const colors = Colors.light;

  useEffect(() => {
    if (missions.length > 0 && id) {
      const foundMission = missions.find(m => m.id === id);
      setMission(foundMission || null);
    }
  }, [missions, id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!mission) return;

    try {
      await updateMissionStatus(mission.id, newStatus);
      Alert.alert(
        'Statut mis à jour',
        `La mission a été marquée comme ${getStatusLabel(newStatus).toLowerCase()}`,
        [{ text: 'OK' }]
      );
      router.back();
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour le statut de la mission',
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'IN_PROGRESS': return colors.info;
      case 'COMPLETED': return colors.success;
      case 'CANCELLED': return colors.error;
      default: return colors.textSecondary;
    }
  };

  if (loading || !mission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Chargement de la mission..." />
      </SafeAreaView>
    );
  }

  const distance = mission.distance || MapUtils.calculateDistance(
    { latitude: mission.departureLat, longitude: mission.departureLng },
    { latitude: mission.arrivalLat, longitude: mission.arrivalLng }
  );

  const canStart = mission.status === 'PENDING';
  const canComplete = mission.status === 'IN_PROGRESS';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* En-tête avec statut */}
        <Card variant="elevated" style={styles.headerCard}>
          <CardHeader
            title={mission.title}
            subtitle={companies[mission.companyId]?.name || 'Entreprise inconnue'}
            action={
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mission.status) }]}>
                <Text style={[styles.statusText, { color: colors.textOnPrimary }]}>
                  {getStatusLabel(mission.status)}
                </Text>
              </View>
            }
          />
        </Card>

        {/* Informations de trajet */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Détails du trajet" />
          <CardContent>
            {/* Carte de l'itinéraire */}
            <View style={styles.mapSection}>
              <RouteMap
                departureLocation={{
                  latitude: mission.departureLat || 0,
                  longitude: mission.departureLng || 0,
                  title: mission.departureLocation,
                  address: mission.departureAddress,
                }}
                arrivalLocation={{
                  latitude: mission.arrivalLat || 0,
                  longitude: mission.arrivalLng || 0,
                  title: mission.arrivalLocation,
                  address: mission.arrivalAddress,
                }}
                routePolyline={mission.routePolyline}
                height={250}
                style={styles.map}
              />
            </View>

            {/* Boutons de navigation externe */}
            <RouteNavigationButtons
              departureLocation={{
                latitude: mission.departureLat || 0,
                longitude: mission.departureLng || 0,
                address: mission.departureAddress,
              }}
              arrivalLocation={{
                latitude: mission.arrivalLat || 0,
                longitude: mission.arrivalLng || 0,
                address: mission.arrivalAddress,
              }}
              style={styles.navigationButtons}
            />

            {/* Départ */}
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.locationLabel, { color: colors.text }]}>Départ</Text>
              </View>
              <Text style={[styles.locationName, { color: colors.text }]}>
                {mission.departureLocation}
              </Text>
              <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
                {mission.departureAddress}
              </Text>
              <Text style={[styles.timeText, { color: colors.primary }]}>
                Prévu : {DateUtils.formatDateTime(mission.scheduledDepartureAt)}
              </Text>
              {mission.actualDepartureAt && (
                <Text style={[styles.actualTimeText, { color: colors.textSecondary }]}>
                  Réel : {DateUtils.formatDateTime(mission.actualDepartureAt)}
                </Text>
              )}
            </View>

            {/* Arrivée */}
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <View style={[styles.locationDot, { backgroundColor: colors.error }]} />
                <Text style={[styles.locationLabel, { color: colors.text }]}>Arrivée</Text>
              </View>
              <Text style={[styles.locationName, { color: colors.text }]}>
                {mission.arrivalLocation}
              </Text>
              <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
                {mission.arrivalAddress}
              </Text>
              <Text style={[styles.timeText, { color: colors.accent }]}>
                Estimée : {DateUtils.formatDateTime(mission.estimatedArrivalAt)}
              </Text>
              {mission.actualArrivalAt && (
                <Text style={[styles.actualTimeText, { color: colors.textSecondary }]}>
                  Réelle : {DateUtils.formatDateTime(mission.actualArrivalAt)}
                </Text>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Informations complémentaires */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Informations complémentaires" />
          <CardContent>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Distance</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{distance} km</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Durée estimée</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {mission.estimatedDuration ? DateUtils.formatDuration(mission.estimatedDuration) : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Passagers</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {mission.currentPassengers}/{mission.maxPassengers}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Client</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {companies[mission.companyId]?.name || 'Entreprise inconnue'}
                </Text>
              </View>
            </View>

            {mission.description && (
              <View style={styles.descriptionSection}>
                <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
                  Description
                </Text>
                <Text style={[styles.descriptionText, { color: colors.text }]}>
                  {mission.description}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        {(canStart || canComplete) && (
          <Card variant="elevated" style={styles.section}>
            <CardContent>
              <View style={styles.actions}>
                {canStart && (
                  <Button
                    title="Commencer la mission"
                    onPress={() => handleStatusUpdate('IN_PROGRESS')}
                    variant="primary"
                    style={styles.actionButton}
                  />
                )}
                {canComplete && (
                  <Button
                    title="Terminer la mission"
                    onPress={() => handleStatusUpdate('COMPLETED')}
                    variant="secondary"
                    style={styles.actionButton}
                  />
                )}
              </View>
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
  },
  headerCard: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    marginLeft: 20,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 20,
  },
  actualTimeText: {
    fontSize: 12,
    marginLeft: 20,
    marginTop: 2,
    fontStyle: 'italic',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  mapSection: {
    marginBottom: 20,
  },
  map: {
    borderRadius: 8,
    marginBottom: 8,
  },
  navigationButtons: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
});
