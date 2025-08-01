import React, { useState, useEffect } from 'react';
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
import { IntegratedRouteMap } from '../../components/IntegratedRouteMap';
import { databaseService, Mission } from '../../lib/database';
import { RouteCalculationService, RouteResult } from '../../services/RouteCalculationService';
import { parseDateTime, addMinutes, validateDateBounds, formatDateTime } from '../../utils/dateHelpers';

export default function CreateMissionScreen() {
  const router = useRouter();
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { drivers, loading: driversLoading } = useDriversWithNotification();

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

  // Validation du formulaire
  const validateForm = () => {
    if (!missionForm.title.trim()) {
      Alert.alert('Erreur', 'Le titre de la mission est requis');
      return false;
    }
    if (!missionForm.pickupLocation.trim()) {
      Alert.alert('Erreur', 'L\'adresse de départ est requise');
      return false;
    }
    if (!missionForm.destination.trim()) {
      Alert.alert('Erreur', 'L\'adresse de destination est requise');
      return false;
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

      // Coordonnées finales (utiliser celles sélectionnées ou par défaut)
      const finalPickupCoords = pickupCoords || { latitude: 48.8566, longitude: 2.3522 };
      const finalDestinationCoords = destinationCoords || { latitude: 48.8566, longitude: 2.3522 };

      // Calculer la distance à partir de l'itinéraire ou distance directe
      let distance = 0;
      let estimatedDurationMinutes = 60;

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
        scheduledDepartureAt: formatDateTime(datetime),
        arrivalLocation: missionForm.destination.trim(),
        arrivalAddress: missionForm.destination.trim(),
        arrivalLat: finalDestinationCoords.latitude,
        arrivalLng: finalDestinationCoords.longitude,
        estimatedArrivalAt: formatDateTime(estimatedEndTime),
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
          <Text style={styles.sectionTitle}>Itinéraire</Text>
          
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

          {/* Aperçu de l'itinéraire */}
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
            title={creating ? "Création..." : "Créer la mission"}
            onPress={handleSubmit}
            disabled={creating}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {/* Modal sélection adresse de départ */}
      <Modal visible={showPickupPicker} animationType="slide" presentationStyle="pageSheet">
        <AddressPickerWithMap
          title="Adresse de départ"
          placeholder="Rechercher l'adresse de départ..."
          onAddressSelected={handlePickupSelected}
          onCancel={() => setShowPickupPicker(false)}
          initialAddress={missionForm.pickupLocation}
          initialCoordinates={pickupCoords || undefined}
        />
      </Modal>

      {/* Modal sélection adresse de destination */}
      <Modal visible={showDestinationPicker} animationType="slide" presentationStyle="pageSheet">
        <AddressPickerWithMap
          title="Adresse de destination"
          placeholder="Rechercher l'adresse de destination..."
          onAddressSelected={handleDestinationSelected}
          onCancel={() => setShowDestinationPicker(false)}
          initialAddress={missionForm.destination}
          initialCoordinates={destinationCoords || undefined}
        />
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
  submitSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  submitButton: {
    marginTop: 16,
  },
});
