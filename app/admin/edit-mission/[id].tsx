import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/Colors';
import { useVehicles } from '../../../hooks/useVehicles';
import { useDriversWithNotification } from '../../../hooks/useDrivers';
import { Button } from '../../../components/ui/Button';
import { AddressPickerWithMap, AddressPickerResult } from '../../../components/AddressPickerWithMap';
import { EnhancedAddressPicker } from '../../../components/EnhancedAddressPicker';
import { databaseService, Mission } from '../../../lib/database';
import { RouteCalculationService, RouteResult } from '../../../services/RouteCalculationService';
import { EnhancedRouteBuilder } from '../../../components/EnhancedRouteBuilder';
import { parseDateTime, addMinutes, formatDateTime } from '../../../utils/dateHelpers';

export default function EditMissionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { drivers, loading: driversLoading } = useDriversWithNotification();

  // État de la mission existante
  const [originalMission, setOriginalMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  // État du formulaire principal
  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    pickupLocation: '',
    destination: '',
    passengerCount: '1',
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    driverId: '',
    vehicleId: '',
    notes: ''
  });

  // Coordonnées des adresses
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Gestion des modales et états
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<RouteResult | null>(null);

  // État pour le mode avancé
  const [useAdvancedRoute, setUseAdvancedRoute] = useState(false);
  const [advancedWaypoints, setAdvancedWaypoints] = useState<any[]>([]);
  const [advancedRouteStats, setAdvancedRouteStats] = useState<any>(null);

  // État de modification
  const [updating, setUpdating] = useState(false);

  // Charger la mission existante
  useEffect(() => {
    loadMission();
  }, [id]);

  const loadMission = async () => {
    try {
      setLoading(true);
      const missions = await databaseService.getAllMissions();
      const mission = missions.find(m => m.id === id as string);
      
      if (!mission) {
        Alert.alert('Erreur', 'Mission non trouvée');
        router.back();
        return;
      }

      setOriginalMission(mission);
      
      console.log('📅 Debug mission date:', {
        raw: mission.scheduledDepartureAt,
        type: typeof mission.scheduledDepartureAt,
        hasT: mission.scheduledDepartureAt?.includes?.('T')
      });
      
      // Remplir le formulaire avec les données existantes
      // Sûrement parser la date qui peut être en format ISO ou français
      let parsedDate = '';
      let parsedTime = '';
      
      try {
        // Essayer le format ISO d'abord (YYYY-MM-DDTHH:MM:SS)
        if (mission.scheduledDepartureAt.includes('T')) {
          const parts = mission.scheduledDepartureAt.split('T');
          parsedDate = parts[0];
          parsedTime = parts[1] ? parts[1].substring(0, 5) : '08:00';
        } else {
          // Format français (02/08/2025, 14:30)
          const dateTime = new Date(mission.scheduledDepartureAt);
          if (!isNaN(dateTime.getTime())) {
            parsedDate = dateTime.toISOString().split('T')[0];
            parsedTime = dateTime.toISOString().split('T')[1].substring(0, 5);
          } else {
            // Fallback par défaut
            const now = new Date();
            parsedDate = now.toISOString().split('T')[0];
            parsedTime = '08:00';
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du parsing de la date:', error);
        const now = new Date();
        parsedDate = now.toISOString().split('T')[0];
        parsedTime = '08:00';
      }

      setMissionForm({
        title: mission.title,
        description: mission.description || '',
        pickupLocation: mission.departureAddress,
        destination: mission.arrivalAddress,
        passengerCount: mission.maxPassengers.toString(),
        date: parsedDate,
        time: parsedTime,
        driverId: mission.driverId || '',
        vehicleId: mission.vehicleId || '',
        notes: '' // Les notes ne sont pas dans l'interface Mission actuelle
      });

      // Si la mission a des coordonnées, les charger
      if (mission.departureLat && mission.departureLng) {
        setPickupCoords({
          latitude: mission.departureLat,
          longitude: mission.departureLng
        });
      }

      if (mission.arrivalLat && mission.arrivalLng) {
        setDestinationCoords({
          latitude: mission.arrivalLat,
          longitude: mission.arrivalLng
        });
      }

    } catch (error) {
      console.error('Erreur lors du chargement de la mission:', error);
      Alert.alert('Erreur', 'Impossible de charger la mission');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Gestion de la sélection d'adresse de départ
  const handlePickupSelected = (result: AddressPickerResult) => {
    setMissionForm(prev => ({
      ...prev,
      pickupLocation: result.address
    }));
    setPickupCoords({
      latitude: result.latitude,
      longitude: result.longitude
    });
    setShowPickupPicker(false);
  };

  // Gestion de la sélection d'adresse de destination
  const handleDestinationSelected = (result: AddressPickerResult) => {
    setMissionForm(prev => ({
      ...prev,
      destination: result.address
    }));
    setDestinationCoords({
      latitude: result.latitude,
      longitude: result.longitude
    });
    setShowDestinationPicker(false);
  };

  // Callback quand l'itinéraire est calculé
  const handleRouteCalculated = (route: RouteResult) => {
    setCalculatedRoute(route);
  };

  // Gestionnaires pour le mode avancé
  const handleAdvancedRouteChange = useCallback((waypoints: any[]) => {
    setAdvancedWaypoints(waypoints);
    
    // Mettre à jour les adresses de départ et destination principales
    if (waypoints.length >= 2) {
      const sortedWaypoints = [...waypoints].sort((a, b) => a.order - b.order);
      const departure = sortedWaypoints[0];
      const destination = sortedWaypoints[sortedWaypoints.length - 1];
      
      setMissionForm(prev => ({
        ...prev,
        pickupLocation: departure.address || prev.pickupLocation,
        destination: destination.address || prev.destination
      }));

      setPickupCoords({
        latitude: departure.latitude,
        longitude: departure.longitude
      });

      setDestinationCoords({
        latitude: destination.latitude,
        longitude: destination.longitude
      });
    }
  }, []);

  const handleAdvancedRouteStatsChange = useCallback((stats: any) => {
    setAdvancedRouteStats(stats);
  }, []);

  const toggleRouteMode = () => {
    if (useAdvancedRoute && advancedWaypoints.length >= 2) {
      // Passer du mode avancé au mode simple - garder départ et destination
      const sortedWaypoints = [...advancedWaypoints].sort((a, b) => a.order - b.order);
      const departure = sortedWaypoints[0];
      const destination = sortedWaypoints[sortedWaypoints.length - 1];
      
      setMissionForm(prev => ({
        ...prev,
        pickupLocation: departure.address,
        destination: destination.address
      }));

      setPickupCoords({
        latitude: departure.latitude,
        longitude: departure.longitude
      });

      setDestinationCoords({
        latitude: destination.latitude,
        longitude: destination.longitude
      });
    }
    
    setUseAdvancedRoute(!useAdvancedRoute);
  };

  // Validation et soumission
  const handleSubmit = async () => {
    // Validation de base
    if (!missionForm.title.trim()) {
      Alert.alert('Erreur', 'Le titre de la mission est requis');
      return;
    }

    if (!missionForm.description.trim()) {
      Alert.alert('Erreur', 'La description de la mission est requise');
      return;
    }

    if (!missionForm.pickupLocation.trim()) {
      Alert.alert('Erreur', 'L\'adresse de départ est requise');
      return;
    }

    if (!missionForm.destination.trim()) {
      Alert.alert('Erreur', 'L\'adresse de destination est requise');
      return;
    }

    if (!missionForm.driverId) {
      Alert.alert('Erreur', 'Un chauffeur doit être sélectionné');
      return;
    }

    if (!missionForm.vehicleId) {
      Alert.alert('Erreur', 'Un véhicule doit être sélectionné');
      return;
    }

    // Validation de la date
    const missionDateTime = parseDateTime(missionForm.date, missionForm.time);
    if (missionDateTime <= new Date()) {
      Alert.alert('Erreur', 'La date et l\'heure de la mission doivent être dans le futur');
      return;
    }

    try {
      setUpdating(true);

      // Calculer les informations de route
      let routeInfo = null;
      if (useAdvancedRoute && advancedRouteStats) {
        // Mode avancé - utiliser les statistiques calculées
        routeInfo = {
          distance: Math.round(advancedRouteStats.totalDistance),
          duration: Math.round(advancedRouteStats.totalDuration),
          polyline: ''
        };
      } else if (calculatedRoute && calculatedRoute.distance) {
        // Mode simple - utiliser l'itinéraire calculé
        routeInfo = {
          distance: Math.round((calculatedRoute.distance || 0) * 1000),
          duration: Math.round(calculatedRoute.duration || 0),
          polyline: JSON.stringify(calculatedRoute.polyline || [])
        };
      }

      // Préparer les données mises à jour
      const updatedMissionData: Partial<Mission> = {
        title: missionForm.title.trim(),
        description: missionForm.description.trim(),
        departureAddress: missionForm.pickupLocation.trim(),
        arrivalAddress: missionForm.destination.trim(),
        maxPassengers: parseInt(missionForm.passengerCount),
        scheduledDepartureAt: missionDateTime.toISOString(),
        driverId: missionForm.driverId,
        vehicleId: missionForm.vehicleId,
        departureLat: pickupCoords?.latitude || 0,
        departureLng: pickupCoords?.longitude || 0,
        arrivalLat: destinationCoords?.latitude || 0,
        arrivalLng: destinationCoords?.longitude || 0,
        distance: routeInfo?.distance || undefined,
        estimatedDuration: routeInfo?.duration || undefined,
        routePolyline: routeInfo?.polyline || undefined,
        updatedAt: new Date().toISOString()
      };

      // Mettre à jour la mission
      await databaseService.updateMission(id as string, updatedMissionData);

      Alert.alert(
        'Succès',
        'Mission mise à jour avec succès !',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la mission. Veuillez réessayer.');
    } finally {
      setUpdating(false);
    }
  };

  // Affichage du loading
  if (loading || vehiclesLoading || driversLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modification de mission</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors.light.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!originalMission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.light.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modification de mission</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors.light.text }]}>
            Mission non trouvée
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const colors = Colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier la mission</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Titre de la mission *</Text>
            <TextInput
              style={styles.input}
              value={missionForm.title}
              onChangeText={(text) => setMissionForm(prev => ({ ...prev, title: text }))}
              placeholder="Titre de la mission"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={missionForm.description}
              onChangeText={(text) => setMissionForm(prev => ({ ...prev, description: text }))}
              placeholder="Description de la mission"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre de passagers</Text>
            <TextInput
              style={styles.input}
              value={missionForm.passengerCount}
              onChangeText={(text) => setMissionForm(prev => ({ ...prev, passengerCount: text }))}
              placeholder="Nombre de passagers"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Itinéraire */}
        <View style={styles.section}>
          <View style={styles.routeHeader}>
            <Text style={styles.sectionTitle}>Itinéraire</Text>
            <TouchableOpacity 
              style={[styles.routeModeToggle, { backgroundColor: colors.primary }]}
              onPress={toggleRouteMode}
            >
              <Text style={[styles.routeModeText, { color: colors.textOnPrimary }]}>
                {useAdvancedRoute ? "Mode avancé" : "Mode simple"}
              </Text>
            </TouchableOpacity>
          </View>

          {!useAdvancedRoute ? (
            <>
              {/* Mode simple */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse de départ *</Text>
                <TouchableOpacity
                  style={styles.addressButton}
                  onPress={() => setShowPickupPicker(true)}
                >
                  <Text style={styles.addressButtonText}>
                    {missionForm.pickupLocation || 'Sélectionner l\'adresse de départ'}
                  </Text>
                  <Ionicons name="location" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse de destination *</Text>
                <TouchableOpacity
                  style={styles.addressButton}
                  onPress={() => setShowDestinationPicker(true)}
                >
                  <Text style={styles.addressButtonText}>
                    {missionForm.destination || 'Sélectionner l\'adresse de destination'}
                  </Text>
                  <Ionicons name="location" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Carte d'aperçu */}
              {pickupCoords && destinationCoords && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Aperçu de l'itinéraire</Text>
                  <View style={styles.routePreview}>
                    <Text style={styles.routePreviewText}>
                      De: {missionForm.pickupLocation}
                    </Text>
                    <Text style={styles.routePreviewText}>
                      À: {missionForm.destination}
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Mode avancé - Constructeur multi-étapes */}
              <EnhancedRouteBuilder
                initialDeparture={pickupCoords ? {
                  address: missionForm.pickupLocation,
                  latitude: pickupCoords.latitude,
                  longitude: pickupCoords.longitude
                } : undefined}
                initialDestination={destinationCoords ? {
                  address: missionForm.destination,
                  latitude: destinationCoords.latitude,
                  longitude: destinationCoords.longitude
                } : undefined}
                onRouteChange={handleAdvancedRouteChange}
                onRouteStatsChange={handleAdvancedRouteStatsChange}
              />
            </>
          )}
        </View>

        {/* Planning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planning</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                value={missionForm.date}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, date: text }))}
                placeholder="AAAA-MM-JJ"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Heure *</Text>
              <TextInput
                style={styles.input}
                value={missionForm.time}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, time: text }))}
                placeholder="HH:MM"
              />
            </View>
          </View>
        </View>

        {/* Affectation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affectation</Text>
          
          {/* Sélection du chauffeur */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Chauffeur *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.driversList}>
              {drivers.map((driver) => (
                <TouchableOpacity
                  key={driver.id}
                  style={[
                    styles.driverCard,
                    missionForm.driverId === driver.id.toString() && styles.selectedDriverCard
                  ]}
                  onPress={() => setMissionForm(prev => ({ ...prev, driverId: driver.id.toString() }))}
                >
                  <Text style={[
                    styles.driverCardName,
                    missionForm.driverId === driver.id.toString() && styles.selectedDriverCardName
                  ]}>
                    {driver.firstName} {driver.lastName}
                  </Text>
                  <Text style={styles.driverCardPhone}>
                    {driver.phoneNumber || 'Pas de téléphone'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sélection du véhicule */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Véhicule *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiclesList}>
              {vehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    missionForm.vehicleId === vehicle.id.toString() && styles.selectedVehicleCard
                  ]}
                  onPress={() => setMissionForm(prev => ({ ...prev, vehicleId: vehicle.id.toString() }))}
                >
                  <Text style={[
                    styles.vehicleCardName,
                    missionForm.vehicleId === vehicle.id.toString() && styles.selectedVehicleCardName
                  ]}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleCardCapacity}>
                    {vehicle.registrationDocument.seats} places
                  </Text>
                  <Text style={styles.vehicleCardPlate}>
                    {vehicle.licensePlate}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes complémentaires</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={missionForm.notes}
            onChangeText={(text) => setMissionForm(prev => ({ ...prev, notes: text }))}
            placeholder="Notes optionnelles..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Bouton de soumission */}
        <View style={styles.submitSection}>
          <Button
            title={updating ? "Mise à jour..." : "Mettre à jour la mission"}
            onPress={handleSubmit}
            disabled={updating}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {/* Modales pour la sélection d'adresse */}
      <Modal
        visible={showPickupPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPickupPicker(false)}
      >
        <EnhancedAddressPicker
          title="Adresse de départ"
          onAddressSelected={handlePickupSelected}
          onCancel={() => setShowPickupPicker(false)}
          initialAddress={missionForm.pickupLocation}
        />
      </Modal>

      <Modal
        visible={showDestinationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDestinationPicker(false)}
      >
        <EnhancedAddressPicker
          title="Adresse de destination"
          onAddressSelected={handleDestinationSelected}
          onCancel={() => setShowDestinationPicker(false)}
          initialAddress={missionForm.destination}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: Colors.light.text,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeModeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  routeModeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: Colors.light.card,
    color: Colors.light.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
  },
  addressButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
  },
  routePreview: {
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  routePreviewText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  routeMap: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  driversList: {
    flexDirection: 'row',
  },
  driverCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    backgroundColor: Colors.light.card,
    minWidth: 120,
  },
  selectedDriverCard: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  driverCardName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.light.text,
  },
  selectedDriverCardName: {
    color: Colors.light.primary,
  },
  driverCardPhone: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  vehiclesList: {
    flexDirection: 'row',
  },
  vehicleCard: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    backgroundColor: Colors.light.card,
    minWidth: 140,
  },
  selectedVehicleCard: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  vehicleCardName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.light.text,
  },
  selectedVehicleCardName: {
    color: Colors.light.primary,
  },
  vehicleCardCapacity: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  vehicleCardPlate: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  submitSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  submitButton: {
    marginTop: 16,
  },
});
