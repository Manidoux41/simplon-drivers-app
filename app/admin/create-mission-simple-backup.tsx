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
import { databaseService, Mission } from '../../lib/database';
import { GeocodingService } from '../../services/GeocodingService';
import { parseDateTime, addMinutes, validateDateBounds, formatDateTime } from '../../utils/dateHelpers';

// Interface simplifiée pour la sélection d'adresse
interface SimpleAddressResult {
  address: string;
  latitude: number;
  longitude: number;
}

const SimpleAddressPicker = ({ 
  visible, 
  onClose, 
  onAddressSelected, 
  title, 
  placeholder,
  initialAddress 
}: {
  visible: boolean;
  onClose: () => void;
  onAddressSelected: (result: SimpleAddressResult) => void;
  title: string;
  placeholder: string;
  initialAddress?: string;
}) => {
  const [searchText, setSearchText] = useState(initialAddress || '');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!searchText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse');
      return;
    }

    setLoading(true);
    try {
      const result = await GeocodingService.geocodeAddress(searchText);
      if (result) {
        onAddressSelected({
          address: result.address,
          latitude: result.latitude,
          longitude: result.longitude
        });
        onClose();
      } else {
        Alert.alert('Erreur', 'Adresse non trouvée');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur de géocodage');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={placeholder}
            autoFocus
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Recherche...' : 'Confirmer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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

  // États des modals
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);

  // Chargement
  const [creating, setCreating] = useState(false);

  // Gestion de la sélection d'adresse de départ
  const handlePickupSelected = (result: SimpleAddressResult) => {
    setMissionForm(prev => ({
      ...prev,
      pickupLocation: result.address
    }));
    setPickupCoords({
      latitude: result.latitude,
      longitude: result.longitude
    });
  };

  // Gestion de la sélection d'adresse de destination
  const handleDestinationSelected = (result: SimpleAddressResult) => {
    setMissionForm(prev => ({
      ...prev,
      destination: result.address
    }));
    setDestinationCoords({
      latitude: result.latitude,
      longitude: result.longitude
    });
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

      // Calcul distance approximatif
      const dx = finalDestinationCoords.latitude - finalPickupCoords.latitude;
      const dy = finalDestinationCoords.longitude - finalPickupCoords.longitude;
      const distance = Math.sqrt(dx * dx + dy * dy) * 111.32; // Approximation en km
      const estimatedDurationMinutes = Math.max(30, Math.round((distance / 50) * 60));

      const estimatedEndTime = addMinutes(datetime, estimatedDurationMinutes);

      const missionData: Mission = {
        id: Date.now().toString(),
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
        companyId: '1',
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

        {/* Adresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinéraire</Text>
          
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

          {/* Info distance si coordonnées disponibles */}
          {pickupCoords && destinationCoords && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoText}>
                📍 Distance estimée: {
                  Math.sqrt(
                    Math.pow(destinationCoords.latitude - pickupCoords.latitude, 2) +
                    Math.pow(destinationCoords.longitude - pickupCoords.longitude, 2)
                  ) * 111.32
                }.toFixed(1) km
              </Text>
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
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Conducteur *</Text>
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

      {/* Modals sélection adresses */}
      <SimpleAddressPicker
        visible={showPickupPicker}
        title="Adresse de départ"
        placeholder="Rechercher l'adresse de départ..."
        onAddressSelected={handlePickupSelected}
        onClose={() => setShowPickupPicker(false)}
        initialAddress={missionForm.pickupLocation}
      />

      <SimpleAddressPicker
        visible={showDestinationPicker}
        title="Adresse de destination"
        placeholder="Rechercher l'adresse de destination..."
        onAddressSelected={handleDestinationSelected}
        onClose={() => setShowDestinationPicker(false)}
        initialAddress={missionForm.destination}
      />
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
  routeInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#dee2e6',
  },
});
