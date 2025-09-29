import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMissions } from '../../hooks/useMissions-local';
import { useDriversWithNotification } from '../../hooks/useDrivers';
import { useVehicles } from '../../hooks/useVehicles';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { RouteMap } from '../../components/RouteMap';
import { RouteNavigationButtons } from '../../components/RouteNavigationButtons';
import { MissionPdfActions } from '../../components/MissionPdfActions';
import { KilometrageWorkflowV2 } from '../../components/KilometrageWorkflowV2';
import { MissionTimeTracker } from '../../components/MissionTimeTracker';
import { OptimizedRouteMap } from '../../components/OptimizedRouteMap';
import { RouteOptimizationHelp } from '../../components/RouteOptimizationHelp';
import { Colors } from '../../constants/Colors';
import { DateUtils } from '../../utils/dateUtils';
import { MapUtils } from '../../utils/mapUtils';
import { Mission } from '../../lib/database';

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams();
  const { missions, companies, updateMissionStatus, loading, loadMissions } = useMissions();
  const { drivers, loading: driversLoading } = useDriversWithNotification();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const [mission, setMission] = useState<Mission | null>(null);
  const [showKilometrageWorkflow, setShowKilometrageWorkflow] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const colors = Colors.light;

  useEffect(() => {
    if (missions.length > 0 && id) {
      const foundMission = missions.find(m => m.id === id);
      setMission(foundMission || null);
    }
  }, [missions, id]);

  const handleMissionUpdate = async () => {
    // Recharger toutes les missions après mise à jour du kilométrage
    try {
      await loadMissions();
      // Mettre à jour la mission locale
      if (missions.length > 0 && id) {
        const foundMission = missions.find(m => m.id === id);
        setMission(foundMission || null);
      }
    } catch (error) {
      console.error('Erreur rechargement mission:', error);
    }
  };

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

  if (loading || driversLoading || vehiclesLoading || !mission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Chargement de la mission..." />
      </SafeAreaView>
    );
  }

  // Préparation des données pour le PDF
  const assignedDriver = drivers.find(d => d.id === mission.driverId);
  const assignedVehicle = vehicles.find(v => v.id === mission.vehicleId);
  
  const pdfData = {
    mission,
    companyName: companies[mission.companyId]?.name || 'Entreprise inconnue',
    driverName: assignedDriver ? `${assignedDriver.firstName} ${assignedDriver.lastName}` : 'Chauffeur non assigné',
    vehicleInfo: assignedVehicle 
      ? `${assignedVehicle.brand} ${assignedVehicle.model} (${assignedVehicle.licensePlate})`
      : 'Véhicule non assigné'
  };

  const distance = mission.distance || MapUtils.calculateDistance(
    { latitude: mission.departureLat, longitude: mission.departureLng },
    { latitude: mission.arrivalLat, longitude: mission.arrivalLng }
  );

  const canStart = mission.status === 'PENDING';
  const canComplete = mission.status === 'IN_PROGRESS';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Bouton de retour vers la page principale */}
        <View style={styles.navigationHeader}>
          <Button
            title="← Retour au tableau de bord"
            onPress={() => router.push('/(tabs)/' as any)}
            variant="ghost"
            style={styles.backButton}
          />
        </View>

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
                height={300}
                showFullMap={true}
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

            {/* Section Itinéraires - Optimisé en priorité */}
            {mission.departureLat && mission.departureLng && mission.arrivalLat && mission.arrivalLng && (
              <View style={styles.routesSection}>
                {/* Itinéraire optimisé en priorité */}
                <View style={styles.routeItem}>
                  <Text style={[styles.routeTitle, { color: colors.text }]}>
                    🚛 Itinéraire optimisé (Recommandé)
                  </Text>
                  <Text style={[styles.routeDescription, { color: colors.textSecondary }]}>
                    Calculé selon votre véhicule et les restrictions de circulation
                  </Text>
                  <RouteOptimizationHelp style={styles.routeHelp} />
                  
                  {/* Carte optimisée intégrée directement */}
                  <View style={styles.optimizedMapContainer}>
                    <OptimizedRouteMap
                      departureCoords={{
                        latitude: mission.departureLat,
                        longitude: mission.departureLng,
                      }}
                      arrivalCoords={{
                        latitude: mission.arrivalLat,
                        longitude: mission.arrivalLng,
                      }}
                      departureAddress={mission.departureAddress}
                      arrivalAddress={mission.arrivalAddress}
                      vehicle={vehicles.find(v => v.id === mission.vehicleId)}
                      onRouteCalculated={(route) => {
                        console.log('Route calculée:', route);
                      }}
                    />
                  </View>
                </View>

                {/* Itinéraire OpenStreetMap standard */}
                <View style={styles.routeItem}>
                  <Text style={[styles.routeTitle, { color: colors.text }]}>
                    🌍 Itinéraire OpenStreetMap
                  </Text>
                  <Text style={[styles.routeDescription, { color: colors.textSecondary }]}>
                    Aperçu cartographique standard avec options de navigation
                  </Text>
                  <RouteMap
                    departureLocation={{
                      latitude: mission.departureLat,
                      longitude: mission.departureLng,
                      title: mission.departureLocation,
                      address: mission.departureAddress
                    }}
                    arrivalLocation={{
                      latitude: mission.arrivalLat,
                      longitude: mission.arrivalLng,
                      title: mission.arrivalLocation,
                      address: mission.arrivalAddress
                    }}
                    height={250}
                    style={styles.routeMapContainer}
                  />
                  <RouteNavigationButtons
                    departureLocation={{
                      latitude: mission.departureLat,
                      longitude: mission.departureLng,
                      address: mission.departureAddress
                    }}
                    arrivalLocation={{
                      latitude: mission.arrivalLat,
                      longitude: mission.arrivalLng,
                      address: mission.arrivalAddress
                    }}
                    style={styles.routeNavButtons}
                  />
                </View>
              </View>
            )}

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

        {/* Actions PDF */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Exporter la mission" />
          <CardContent>
            <MissionPdfActions 
              missionData={pdfData}
              style={styles.pdfActions}
            />
            <Text style={[styles.pdfHint, { color: colors.textSecondary }]}>
              💡 Imprimez ou partagez les détails de cette mission au format PDF pour archivage ou transmission.
            </Text>
          </CardContent>
        </Card>

        {/* Résumé kilométrique pour missions terminées */}
        {mission.status === 'COMPLETED' && (mission.kmDepotStart || mission.kmMissionStart || mission.kmMissionEnd || mission.kmDepotEnd) && (
          <Card variant="elevated" style={styles.section}>
            <CardHeader title="📊 Résumé kilométrique" />
            <CardContent>
              <View style={styles.kilometricSummary}>
                {mission.kmDepotStart && (
                  <View style={styles.kmRow}>
                    <Text style={[styles.kmLabel, { color: colors.textSecondary }]}>
                      🏢 Départ dépôt:
                    </Text>
                    <Text style={[styles.kmValue, { color: colors.text }]}>
                      {mission.kmDepotStart.toLocaleString()} km
                    </Text>
                  </View>
                )}
                {mission.kmMissionStart && (
                  <View style={styles.kmRow}>
                    <Text style={[styles.kmLabel, { color: colors.textSecondary }]}>
                      🎯 Début mission:
                    </Text>
                    <Text style={[styles.kmValue, { color: colors.text }]}>
                      {mission.kmMissionStart.toLocaleString()} km
                    </Text>
                  </View>
                )}
                {mission.kmMissionEnd && (
                  <View style={styles.kmRow}>
                    <Text style={[styles.kmLabel, { color: colors.textSecondary }]}>
                      🏁 Fin mission:
                    </Text>
                    <Text style={[styles.kmValue, { color: colors.text }]}>
                      {mission.kmMissionEnd.toLocaleString()} km
                    </Text>
                  </View>
                )}
                {mission.kmDepotEnd && (
                  <View style={styles.kmRow}>
                    <Text style={[styles.kmLabel, { color: colors.textSecondary }]}>
                      🏢 Retour dépôt:
                    </Text>
                    <Text style={[styles.kmValue, { color: colors.text }]}>
                      {mission.kmDepotEnd.toLocaleString()} km
                    </Text>
                  </View>
                )}
                
                {mission.kmDepotStart && mission.kmDepotEnd && (
                  <View style={[styles.kmRow, styles.totalKmRow]}>
                    <Text style={[styles.kmLabel, { color: colors.text, fontWeight: '600' }]}>
                      📏 Distance totale:
                    </Text>
                    <Text style={[styles.kmValue, styles.totalKmValue, { color: colors.primary }]}>
                      {(mission.kmDepotEnd - mission.kmDepotStart).toLocaleString()} km
                    </Text>
                  </View>
                )}
              </View>
              
              <Button
                title="✏️ Modifier le kilométrage"
                onPress={() => setShowKilometrageWorkflow(true)}
                variant="ghost"
                style={styles.editKmButton}
              />
            </CardContent>
          </Card>
        )}

        {/* Système de Kilométrage */}
        {(canStart || canComplete || mission.status === 'IN_PROGRESS') && (
          <Card variant="elevated" style={styles.section}>
            <CardHeader title="Suivi kilométrique" />
            <CardContent>
              <Button
                title="📊 Gérer le kilométrage"
                onPress={() => setShowKilometrageWorkflow(true)}
                variant="primary"
                style={styles.actionButton}
              />
              <Text style={[styles.pdfHint, { color: colors.textSecondary }]}>
                🚗 Suivez précisément les distances parcourues pour cette mission
              </Text>
            </CardContent>
          </Card>
        )}

        {/* Modal du workflow kilométrique */}
        <Modal
          visible={showKilometrageWorkflow}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowKilometrageWorkflow(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <KilometrageWorkflowV2
              missionId={mission.id}
              onClose={() => setShowKilometrageWorkflow(false)}
              onMissionUpdated={handleMissionUpdate}
            />
          </SafeAreaView>
        </Modal>

        {/* Suivi des temps de travail */}
        {mission.status === 'IN_PROGRESS' || mission.status === 'COMPLETED' ? (
          <Card variant="elevated" style={styles.section}>
            <CardHeader title="Temps de travail" />
            <CardContent>
              {/* Affichage des temps actuels */}
              <View style={styles.timeStatsContainer}>
                <View style={styles.timeStatRow}>
                  <View style={styles.timeStatItem}>
                    <Text style={[styles.timeStatLabel, { color: colors.textSecondary }]}>
                      🚗 Conduite
                    </Text>
                    <Text style={[styles.timeStatValue, { color: colors.text }]}>
                      {mission.drivingTimeMinutes ? 
                        `${Math.floor(mission.drivingTimeMinutes / 60)}h${(mission.drivingTimeMinutes % 60).toString().padStart(2, '0')}` 
                        : 'Non renseigné'}
                    </Text>
                  </View>
                  
                  <View style={styles.timeStatItem}>
                    <Text style={[styles.timeStatLabel, { color: colors.textSecondary }]}>
                      😴 Repos
                    </Text>
                    <Text style={[styles.timeStatValue, { color: colors.text }]}>
                      {mission.restTimeMinutes ? 
                        `${Math.floor(mission.restTimeMinutes / 60)}h${(mission.restTimeMinutes % 60).toString().padStart(2, '0')}` 
                        : 'Non renseigné'}
                    </Text>
                  </View>
                </View>

                <View style={styles.timeStatRow}>
                  <View style={styles.timeStatItem}>
                    <Text style={[styles.timeStatLabel, { color: colors.textSecondary }]}>
                      ⏳ Attente
                    </Text>
                    <Text style={[styles.timeStatValue, { color: colors.text }]}>
                      {mission.waitingTimeMinutes ? 
                        `${Math.floor(mission.waitingTimeMinutes / 60)}h${(mission.waitingTimeMinutes % 60).toString().padStart(2, '0')}` 
                        : 'Non renseigné'}
                    </Text>
                  </View>

                  <View style={styles.timeStatItem}>
                    <Text style={[styles.timeStatLabel, { color: colors.textSecondary }]}>
                      📊 Total
                    </Text>
                    <Text style={[styles.timeStatValue, styles.totalTime, { color: colors.primary }]}>
                      {(() => {
                        const total = (mission.drivingTimeMinutes || 0) + (mission.restTimeMinutes || 0) + (mission.waitingTimeMinutes || 0);
                        return total > 0 ? 
                          `${Math.floor(total / 60)}h${(total % 60).toString().padStart(2, '0')}` 
                          : 'Aucun temps';
                      })()}
                    </Text>
                  </View>
                </View>

                {mission.drivingTimeComment && (
                  <View style={styles.commentSection}>
                    <Text style={[styles.commentLabel, { color: colors.textSecondary }]}>
                      💬 Commentaires:
                    </Text>
                    <Text style={[styles.commentText, { color: colors.text }]}>
                      {mission.drivingTimeComment}
                    </Text>
                  </View>
                )}
              </View>

              <Button
                title="⏱️ Modifier les temps de travail"
                onPress={() => setShowTimeTracker(true)}
                variant="ghost"
                style={styles.editTimeButton}
              />
              
              <Text style={[styles.timeHint, { color: colors.textSecondary }]}>
                ⏱️ Renseignez vos temps de conduite, repos et attente pour un suivi précis
              </Text>
            </CardContent>
          </Card>
        ) : null}

        {/* Modal du tracker de temps */}
        <MissionTimeTracker
          missionId={mission.id}
          isVisible={showTimeTracker}
          onClose={() => setShowTimeTracker(false)}
          onTimesSaved={handleMissionUpdate}
          initialTimes={{
            drivingTimeMinutes: mission.drivingTimeMinutes,
            restTimeMinutes: mission.restTimeMinutes,
            waitingTimeMinutes: mission.waitingTimeMinutes,
            drivingTimeComment: mission.drivingTimeComment,
          }}
        />

        {/* Actions de statut alternatives (si pas de kilométrage actif) */}
        {(canStart || canComplete) && mission.status !== 'IN_PROGRESS' && (
          <Card variant="elevated" style={styles.section}>
            <CardHeader title="Actions de mission" />
            <CardContent>
              <View style={styles.actions}>
                {canStart && (
                  <Button
                    title="Démarrer sans kilométrage"
                    onPress={() => handleStatusUpdate('IN_PROGRESS')}
                    variant="ghost"
                    style={styles.actionButton}
                  />
                )}
                {canComplete && (
                  <Button
                    title="Terminer sans kilométrage"
                    onPress={() => handleStatusUpdate('COMPLETED')}
                    variant="ghost"
                    style={styles.actionButton}
                  />
                )}
              </View>
              <Text style={[styles.alternativeHint, { color: colors.textSecondary }]}>
                ⚠️ Actions alternatives sans suivi kilométrique
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
  scrollContent: {
    padding: 16,
  },
  navigationHeader: {
    marginBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  pdfActions: {
    marginBottom: 12,
  },
  pdfHint: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  alternativeHint: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  mapSection: {
    marginBottom: 20,
  },
  map: {
    borderRadius: 8,
    marginBottom: 8,
  },
  navigationButtonsContainer: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  routeButton: {
    marginBottom: 20,
  },
  routeHelp: {
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
  },
  kilometricSummary: {
    marginBottom: 16,
  },
  kmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  totalKmRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  kmLabel: {
    fontSize: 14,
  },
  kmValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalKmValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editKmButton: {
    marginTop: 8,
  },
  timeStatsContainer: {
    marginBottom: 16,
  },
  timeStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  timeStatLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  timeStatValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  totalTime: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  editTimeButton: {
    marginTop: 8,
  },
  timeHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  routesSection: {
    marginBottom: 20,
  },
  routeItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  routeMapContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  navigationButtons: {
    marginTop: 8,
  },
  routeNavButtons: {
    marginTop: 8,
  },
  optimizedMapContainer: {
    height: 300,
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
});
