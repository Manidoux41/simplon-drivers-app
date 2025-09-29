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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useVehicles } from '../../hooks/useVehicles';
import { useDriversWithNotification } from '../../hooks/useDrivers';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { PhoneButton } from '../../components/ui/PhoneButton';
import { AddressPickerWithMap, AddressPickerResult } from '../../components/AddressPickerWithMap';
import { EnhancedAddressPicker } from '../../components/EnhancedAddressPicker';
import { IntegratedRouteMap } from '../../components/IntegratedRouteMap';
import { databaseService, Mission } from '../../lib/database';
import { RouteCalculationService, RouteResult } from '../../services/RouteCalculationService';
import { heavyVehicleRouteService, OptimizedRoute, HeavyVehicleRouteOptions } from '../../services/HeavyVehicleRouteService';
import { EnhancedRouteBuilder } from '../../components/EnhancedRouteBuilder';
import { parseDateTime, addMinutes, validateDateBounds, formatDateTimeISO } from '../../utils/dateHelpers';

export default function CreateMissionScreen() {
  const router = useRouter();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { drivers, loading: driversLoading } = useDriversWithNotification();

  // Debug: afficher le nombre de véhicules
  React.useEffect(() => {
    console.log('🚗 Véhicules chargés:', vehicles.length, vehicles);
  }, [vehicles]);

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
  
  // Itinéraire calculé
  const [calculatedRoute, setCalculatedRoute] = useState<RouteResult | null>(null);

  // États des modals
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  
  // Mode de création d'itinéraire
  const [useAdvancedRoute, setUseAdvancedRoute] = useState(false);
  const [advancedWaypoints, setAdvancedWaypoints] = useState<any[]>([]);
  const [advancedRouteStats, setAdvancedRouteStats] = useState<any>(null);

  // Optimisation d'itinéraire poids lourds
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);

  // Chargement
  const [creating, setCreating] = useState(false);

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

  // Optimisation d'itinéraire pour poids lourds
  const handleOptimizeRoute = async () => {
    if (!pickupCoords || !destinationCoords) {
      Alert.alert('Erreur', 'Veuillez sélectionner les adresses de départ et de destination');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === missionForm.vehicleId);
    if (!selectedVehicle) {
      Alert.alert('Erreur', 'Veuillez sélectionner un véhicule');
      return;
    }

    // Vérifier si c'est un véhicule lourd
    if (!heavyVehicleRouteService.isHeavyVehicle(selectedVehicle)) {
      Alert.alert(
        'Information', 
        'L\'optimisation d\'itinéraire est spécialement conçue pour les véhicules de plus de 19 tonnes. Ce véhicule semble être plus léger.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Continuer quand même', onPress: () => proceedWithOptimization(selectedVehicle) }
        ]
      );
      return;
    }

    proceedWithOptimization(selectedVehicle);
  };

  const proceedWithOptimization = async (vehicle: any) => {
    setIsOptimizing(true);
    try {
      const vehicleOptions = heavyVehicleRouteService.buildVehicleOptions(vehicle);
      
      console.log('🚛 Optimisation d\'itinéraire poids lourd:', {
        vehicle: vehicle.licensePlate,
        weight: vehicleOptions.weight,
        from: missionForm.pickupLocation,
        to: missionForm.destination
      });

      const optimized = await heavyVehicleRouteService.calculateHeavyVehicleRoute(
        pickupCoords!,
        destinationCoords!,
        vehicleOptions
      );

      setOptimizedRoute(optimized);
      setShowOptimizedRoute(true);

      // Mettre à jour l'itinéraire calculé si l'optimisation a réussi
      if (optimized && !optimized.warnings.some(w => w.includes('Service indisponible'))) {
        // Convertir la polyline string en RoutePoint[] pour compatibilité
        const routePoints = optimized.instructions.map(instruction => ({
          latitude: instruction.coordinate[1],
          longitude: instruction.coordinate[0]
        }));

        setCalculatedRoute({
          distance: optimized.distance / 1000, // Convertir en km
          duration: optimized.duration / 60, // Convertir en minutes
          polyline: routePoints,
          segments: [], // Segments vides pour l'instant
          summary: {
            totalDistance: `${(optimized.distance / 1000).toFixed(1)} km`,
            totalDuration: `${Math.round(optimized.duration / 60)} min`
          }
        });
      }

      Alert.alert(
        'Itinéraire optimisé',
        `Itinéraire calculé spécialement pour votre véhicule de ${vehicleOptions.weight}t.\n\nDistance: ${(optimized.distance / 1000).toFixed(1)} km\nDurée: ${Math.round(optimized.duration / 60)} min${optimized.warnings.length > 0 ? '\n\n⚠️ Vérifiez les avertissements' : ''}`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      Alert.alert(
        'Erreur d\'optimisation',
        `Impossible d'optimiser l'itinéraire: ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nVous pouvez continuer avec un itinéraire standard.`
      );
    } finally {
      setIsOptimizing(false);
    }
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

  // Validation du formulaire
  const validateForm = () => {
    if (!missionForm.title.trim()) {
      Alert.alert('Erreur', 'Le titre de la mission est requis');
      return false;
    }

    // Validation selon le mode
    if (useAdvancedRoute) {
      if (advancedWaypoints.length < 2) {
        Alert.alert('Erreur', 'Veuillez définir au moins un point de départ et d\'arrivée');
        return false;
      }
      
      const hasEmptyWaypoints = advancedWaypoints.some(w => !w.address || !w.latitude || !w.longitude);
      if (hasEmptyWaypoints) {
        Alert.alert('Erreur', 'Toutes les étapes doivent avoir une adresse valide');
        return false;
      }
    } else {
      if (!missionForm.pickupLocation.trim()) {
        Alert.alert('Erreur', 'L\'adresse de départ est requise');
        return false;
      }
      if (!missionForm.destination.trim()) {
        Alert.alert('Erreur', 'L\'adresse de destination est requise');
        return false;
      }
    }

    if (!missionForm.driverId) {
      Alert.alert('Erreur', 'Un conducteur doit être sélectionné');
      return false;
    }
    if (!missionForm.vehicleId) {
      Alert.alert('Erreur', 'Un véhicule doit être sélectionné');
      return false;
    }

    const passengerCount = parseInt(missionForm.passengerCount);
    if (isNaN(passengerCount) || passengerCount <= 0) {
      Alert.alert('Erreur', 'Le nombre de passagers doit être un nombre positif');
      return false;
    }

    const datetime = parseDateTime(missionForm.date, missionForm.time);
    if (!datetime) {
      Alert.alert('Erreur', 'Date ou heure invalide');
      return false;
    }

    try {
      validateDateBounds(datetime);
    } catch (error: any) {
      Alert.alert('Date invalide', error.message || 'Date invalide');
      return false;
    }

    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      const datetime = parseDateTime(missionForm.date, missionForm.time);
      if (!datetime) throw new Error('Date/heure invalide');

      // Coordonnées finales selon le mode
      let finalPickupCoords, finalDestinationCoords;
      let distance = 0;
      let estimatedDurationMinutes = 60;

      if (useAdvancedRoute && advancedWaypoints.length >= 2) {
        // Mode avancé - utiliser les statistiques calculées
        const sortedWaypoints = [...advancedWaypoints].sort((a, b) => a.order - b.order);
        finalPickupCoords = {
          latitude: sortedWaypoints[0].latitude,
          longitude: sortedWaypoints[0].longitude
        };
        finalDestinationCoords = {
          latitude: sortedWaypoints[sortedWaypoints.length - 1].latitude,
          longitude: sortedWaypoints[sortedWaypoints.length - 1].longitude
        };

        if (advancedRouteStats) {
          distance = advancedRouteStats.totalDistance / 1000; // convertir en km
          estimatedDurationMinutes = advancedRouteStats.totalDuration;
        } else {
          // Fallback si pas de stats
          const dx = finalDestinationCoords.latitude - finalPickupCoords.latitude;
          const dy = finalDestinationCoords.longitude - finalPickupCoords.longitude;
          distance = Math.sqrt(dx * dx + dy * dy) * 111.32;
          estimatedDurationMinutes = Math.max(30, Math.round((distance / 50) * 60));
        }
      } else {
        // Mode simple - utiliser les coordonnées sélectionnées ou par défaut
        finalPickupCoords = pickupCoords || { latitude: 48.8566, longitude: 2.3522 };
        finalDestinationCoords = destinationCoords || { latitude: 48.8566, longitude: 2.3522 };

        // Calculer la distance à partir de l'itinéraire ou distance directe
        if (calculatedRoute) {
          distance = calculatedRoute.distance;
          estimatedDurationMinutes = calculatedRoute.duration;
        } else {
          // Calcul distance directe si pas d'itinéraire
          const dx = finalDestinationCoords.latitude - finalPickupCoords.latitude;
          const dy = finalDestinationCoords.longitude - finalPickupCoords.longitude;
          distance = Math.sqrt(dx * dx + dy * dy) * 111.32; // Approximation en km
          estimatedDurationMinutes = Math.max(30, Math.round((distance / 50) * 60));
        }
      }

      const estimatedEndTime = addMinutes(datetime, estimatedDurationMinutes);

      const missionData: Mission = {
        id: Date.now().toString(), // Génération d'ID simple
        title: missionForm.title.trim(),
        description: missionForm.description.trim(),
        status: 'PENDING',
        departureLocation: missionForm.pickupLocation.trim(),
        departureAddress: missionForm.pickupLocation.trim(),
        departureLat: finalPickupCoords.latitude,
        departureLng: finalPickupCoords.longitude,
        scheduledDepartureAt: formatDateTimeISO(datetime),
        arrivalLocation: missionForm.destination.trim(),
        arrivalAddress: missionForm.destination.trim(),
        arrivalLat: finalDestinationCoords.latitude,
        arrivalLng: finalDestinationCoords.longitude,
        estimatedArrivalAt: formatDateTimeISO(estimatedEndTime),
        distance: distance,
        estimatedDuration: estimatedDurationMinutes,
        maxPassengers: parseInt(missionForm.passengerCount),
        currentPassengers: 0,
        driverId: missionForm.driverId,
        companyId: '1', // ID company par défaut
        vehicleId: missionForm.vehicleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await databaseService.createMission(missionData);

      Alert.alert(
        'Mission créée',
        'La mission a été créée avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error: any) {
      console.error('Erreur création mission:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer la mission');
    } finally {
      setCreating(false);
    }
  };

  if (vehiclesLoading || driversLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Nouvelle Mission" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Titre de la mission *</Text>
            <TextInput
              style={styles.input}
              value={missionForm.title}
              onChangeText={(text) => setMissionForm(prev => ({ ...prev, title: text }))}
              placeholder="Ex: Transport école"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={missionForm.description}
              onChangeText={(text) => setMissionForm(prev => ({ ...prev, description: text }))}
              placeholder="Description optionnelle..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre de passagers *</Text>
            <TextInput
              style={styles.input}
              value={missionForm.passengerCount}
              onChangeText={(text) => setMissionForm(prev => ({ ...prev, passengerCount: text }))}
              placeholder="Ex: 25"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Adresses et itinéraire */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Itinéraire</Text>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                useAdvancedRoute && styles.toggleButtonActive
              ]}
              onPress={toggleRouteMode}
            >
              <Ionicons 
                name={useAdvancedRoute ? "map" : "location"} 
                size={16} 
                color={useAdvancedRoute ? "#fff" : Colors.light.primary} 
              />
              <Text style={[
                styles.toggleButtonText,
                useAdvancedRoute && styles.toggleButtonTextActive
              ]}>
                {useAdvancedRoute ? "Mode avancé" : "Mode simple"}
              </Text>
            </TouchableOpacity>
          </View>

          {!useAdvancedRoute ? (
            <>
              {/* Mode simple - Adresses séparées */}
              {/* Adresse de départ */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse de départ *</Text>
                <TouchableOpacity
                  style={styles.addressButton}
                  onPress={() => setShowPickupPicker(true)}
                >
                  <Ionicons name="location" size={20} color={Colors.light.primary} />
                  <Text style={[
                    styles.addressButtonText,
                    !missionForm.pickupLocation && styles.placeholderText
                  ]}>
                    {missionForm.pickupLocation || "Sélectionner l'adresse de départ"}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Adresse de destination */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Adresse de destination *</Text>
                <TouchableOpacity
                  style={styles.addressButton}
                  onPress={() => setShowDestinationPicker(true)}
                >
                  <Ionicons name="location" size={20} color={Colors.light.primary} />
                  <Text style={[
                    styles.addressButtonText,
                    !missionForm.destination && styles.placeholderText
                  ]}>
                    {missionForm.destination || "Sélectionner l'adresse de destination"}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Aperçu de l'itinéraire simple */}
              {pickupCoords && destinationCoords && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Aperçu de l'itinéraire</Text>
                  <IntegratedRouteMap
                    startPoint={pickupCoords}
                    endPoint={destinationCoords}
                    startAddress={missionForm.pickupLocation}
                    endAddress={missionForm.destination}
                    onRouteCalculated={handleRouteCalculated}
                    style={styles.routeMap}
                  />
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
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                value={missionForm.date}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
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

        {/* Assignation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assignation</Text>
          
          {/* Sélection du conducteur */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Conducteur *</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="person" size={20} color={Colors.light.primary} />
              <View style={styles.pickerContent}>
                {missionForm.driverId ? (
                  (() => {
                    const selectedDriver = drivers.find(d => d.id.toString() === missionForm.driverId);
                    return selectedDriver ? (
                      <View style={styles.selectedDriverContainer}>
                        <Text style={styles.selectedDriverName}>
                          {selectedDriver.firstName} {selectedDriver.lastName}
                        </Text>
                        <PhoneButton 
                          phoneNumber={selectedDriver.phoneNumber || '0000000000'} 
                          size={16} 
                        />
                      </View>
                    ) : null;
                  })()
                ) : (
                  <Text style={styles.pickerPlaceholder}>Sélectionner un conducteur</Text>
                )}
              </View>
            </View>
            
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
                  <PhoneButton 
                    phoneNumber={driver.phoneNumber || '0000000000'} 
                    size={16} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sélection du véhicule */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Véhicule *</Text>
            {vehicles.length === 0 ? (
              <Text style={[styles.emptyText, { color: Colors.light.textSecondary }]}>
                Aucun véhicule disponible
              </Text>
            ) : (
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
            )}
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

        {/* Bouton d'optimisation d'itinéraire */}
        {missionForm.vehicleId && pickupCoords && destinationCoords && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.optimizeButton,
                isOptimizing && styles.optimizeButtonDisabled
              ]}
              onPress={handleOptimizeRoute}
              disabled={isOptimizing}
            >
              <Ionicons 
                name={isOptimizing ? "hourglass" : "navigate"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.optimizeButtonText}>
                {isOptimizing ? "Optimisation..." : "Optimiser l'itinéraire (Poids Lourds)"}
              </Text>
            </TouchableOpacity>
            
            {optimizedRoute && (
              <TouchableOpacity
                style={styles.routeInfoButton}
                onPress={() => setShowOptimizedRoute(true)}
              >
                <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                <Text style={styles.routeInfoText}>
                  {(optimizedRoute.distance / 1000).toFixed(1)} km • {Math.round(optimizedRoute.duration / 60)} min
                  {optimizedRoute.warnings.length > 0 && ' • ⚠️ Avertissements'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bouton de soumission */}
        <View style={styles.submitSection}>
          <Button
            title={creating ? "Création..." : "Créer la mission"}
            onPress={handleSubmit}
            disabled={creating}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {/* Modal sélection adresse de départ */}
      <Modal visible={showPickupPicker} animationType="slide" presentationStyle="pageSheet">
        <EnhancedAddressPicker
          title="Adresse de départ"
          placeholder="Tapez l'adresse complète de départ (rue, ville...)"
          onAddressSelected={handlePickupSelected}
          onCancel={() => setShowPickupPicker(false)}
          initialAddress={missionForm.pickupLocation}
          initialCoordinates={pickupCoords || undefined}
          showMap={true}
        />
      </Modal>

      {/* Modal sélection adresse de destination */}
      <Modal visible={showDestinationPicker} animationType="slide" presentationStyle="pageSheet">
        <EnhancedAddressPicker
          title="Adresse de destination"
          placeholder="Tapez l'adresse complète de destination (rue, ville...)"
          onAddressSelected={handleDestinationSelected}
          onCancel={() => setShowDestinationPicker(false)}
          initialAddress={missionForm.destination}
          initialCoordinates={destinationCoords || undefined}
          showMap={true}
        />
      </Modal>

      {/* Modal détails itinéraire optimisé */}
      <Modal visible={showOptimizedRoute} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Itinéraire Optimisé Poids Lourds</Text>
            <TouchableOpacity
              onPress={() => setShowOptimizedRoute(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {optimizedRoute && (
              <>
                {/* Résumé de l'itinéraire */}
                <View style={styles.routeSummary}>
                  <View style={styles.routeSummaryItem}>
                    <Ionicons name="navigate" size={20} color={Colors.light.primary} />
                    <Text style={styles.routeSummaryText}>
                      {(optimizedRoute.distance / 1000).toFixed(1)} km
                    </Text>
                  </View>
                  <View style={styles.routeSummaryItem}>
                    <Ionicons name="time" size={20} color={Colors.light.primary} />
                    <Text style={styles.routeSummaryText}>
                      {Math.round(optimizedRoute.duration / 60)} min
                    </Text>
                  </View>
                  {optimizedRoute.tollInfo && (
                    <View style={styles.routeSummaryItem}>
                      <Ionicons name="card" size={20} color={Colors.light.warning} />
                      <Text style={styles.routeSummaryText}>
                        {optimizedRoute.tollInfo.totalCost.toFixed(2)} {optimizedRoute.tollInfo.currency}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Avertissements */}
                {optimizedRoute.warnings.length > 0 && (
                  <View style={styles.warningsSection}>
                    <Text style={styles.warningsTitle}>⚠️ Avertissements</Text>
                    {optimizedRoute.warnings.map((warning, index) => (
                      <Text key={index} style={styles.warningText}>
                        • {warning}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Restrictions */}
                {optimizedRoute.restrictions.length > 0 && (
                  <View style={styles.restrictionsSection}>
                    <Text style={styles.restrictionsTitle}>🚫 Restrictions</Text>
                    {optimizedRoute.restrictions.map((restriction, index) => (
                      <View key={index} style={styles.restrictionItem}>
                        <Text style={[
                          styles.restrictionText,
                          restriction.severity === 'error' && styles.restrictionError
                        ]}>
                          {restriction.severity === 'error' ? '🔴' : '🟡'} {restriction.description}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Instructions */}
                {optimizedRoute.instructions.length > 0 && (
                  <View style={styles.instructionsSection}>
                    <Text style={styles.instructionsTitle}>📋 Instructions</Text>
                    {optimizedRoute.instructions.slice(0, 10).map((instruction, index) => (
                      <View key={index} style={styles.instructionItem}>
                        <Text style={styles.instructionText}>
                          {index + 1}. {instruction.text}
                        </Text>
                        <Text style={styles.instructionDistance}>
                          {(instruction.distance / 1000).toFixed(1)} km
                        </Text>
                      </View>
                    ))}
                    {optimizedRoute.instructions.length > 10 && (
                      <Text style={styles.moreInstructions}>
                        ... et {optimizedRoute.instructions.length - 10} autres instructions
                      </Text>
                    )}
                  </View>
                )}

                {/* Informations sur les péages */}
                {optimizedRoute.tollInfo && optimizedRoute.tollInfo.sections.length > 0 && (
                  <View style={styles.tollSection}>
                    <Text style={styles.tollTitle}>💳 Péages</Text>
                    {optimizedRoute.tollInfo.sections.map((section, index) => (
                      <View key={index} style={styles.tollItem}>
                        <Text style={styles.tollName}>{section.name}</Text>
                        <Text style={styles.tollCost}>
                          {section.cost.toFixed(2)} {optimizedRoute.tollInfo!.currency}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => setShowOptimizedRoute(false)}
            >
              <Text style={styles.modalActionText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: 'transparent',
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  addressButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  routeMap: {
    height: 200,
    marginTop: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  pickerContent: {
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  selectedDriverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDriverName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  driversList: {
    marginTop: 8,
  },
  driverCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 120,
  },
  selectedDriverCard: {
    backgroundColor: Colors.light.primary + '15',
    borderColor: Colors.light.primary,
  },
  driverCardName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  selectedDriverCardName: {
    color: Colors.light.primary,
  },
  vehiclesList: {
    marginTop: 8,
  },
  vehicleCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 140,
  },
  selectedVehicleCard: {
    backgroundColor: Colors.light.primary + '15',
    borderColor: Colors.light.primary,
  },
  vehicleCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  selectedVehicleCardName: {
    color: Colors.light.primary,
  },
  vehicleCardCapacity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  vehicleCardPlate: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  submitSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  submitButton: {
    marginTop: 16,
  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981', // Vert pour l'optimisation
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  optimizeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  optimizeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  routeInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  routeInfoText: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
  // Styles pour la modal d'itinéraire optimisé
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalActionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  routeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    paddingVertical: 16,
    marginVertical: 16,
  },
  routeSummaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  routeSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  warningsSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 4,
  },
  restrictionsSection: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  restrictionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  restrictionItem: {
    marginBottom: 4,
  },
  restrictionText: {
    fontSize: 14,
    color: '#7f1d1d',
  },
  restrictionError: {
    fontWeight: '600',
  },
  instructionsSection: {
    marginVertical: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginRight: 8,
  },
  instructionDistance: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  moreInstructions: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  tollSection: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  tollTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  tollItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tollName: {
    fontSize: 14,
    color: Colors.light.text,
  },
  tollCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8',
  },
});
