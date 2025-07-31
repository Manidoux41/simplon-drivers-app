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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useVehicles } from '../../hooks/useVehicles';
import { useDriversWithNotification } from '../../hooks/useDrivers';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { PhoneButton } from '../../components/ui/PhoneButton';
import { databaseService } from '../../lib/database';
import { GeocodingService } from '../../services/GeocodingService';
import { parseDateTime, addMinutes, validateDateBounds, formatDateTime } from '../../utils/dateHelpers';

interface AddressPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, coordinates: { latitude: number; longitude: number }) => void;
  title: string;
}

const AddressPicker: React.FC<AddressPickerProps> = ({ visible, onClose, onSelectAddress, title }) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchAddresses = async (text: string) => {
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await GeocodingService.geocodeAddress(text);
      if (result) {
        setSearchResults([result]);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Erreur de recherche:', error);
      setSearchResults([]);
      
      // Proposer une saisie manuelle si le géocodage échoue
      if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
        Alert.alert(
          'Service temporairement indisponible',
          'Le service de géolocalisation est temporairement surchargé. Vous pouvez saisir l\'adresse manuellement.',
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (result: any) => {
    onSelectAddress(result.address || searchText, {
      latitude: result.latitude,
      longitude: result.longitude
    });
    setSearchText('');
    setSearchResults([]);
    onClose();
  };

  const handleManualEntry = () => {
    if (searchText.length >= 3) {
      // Utiliser le géocodage intelligent pour la saisie manuelle
      GeocodingService.geocodeAddress(searchText)
        .then((result: any) => {
          if (result) {
            onSelectAddress(result.address, {
              latitude: result.latitude,
              longitude: result.longitude
            });
            if (result.isApproximate) {
              Alert.alert(
                'Position approximative',
                'L\'adresse a été géocodée approximativement. Vérifiez la position sur la carte.',
                [{ text: 'OK' }]
              );
            }
          } else {
            Alert.alert('Erreur', 'Impossible de localiser cette adresse');
          }
        })
        .catch((error: any) => {
          console.error('Erreur géocodage manuel:', error);
          Alert.alert('Erreur', 'Erreur lors du géocodage de l\'adresse');
        })
        .finally(() => {
          setSearchText('');
          setSearchResults([]);
          onClose();
        });
    } else {
      Alert.alert('Erreur', 'Veuillez saisir au moins 3 caractères');
    }
  };

  const getCurrentLocation = async () => {
    setIsSearching(true);
    try {
      const position = await GeocodingService.getCurrentPosition();
      if (position) {
        onSelectAddress(
          position.address || `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`,
          {
            latitude: position.latitude,
            longitude: position.longitude
          }
        );
        onClose();
      } else {
        Alert.alert('Erreur', 'Position non disponible');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'obtenir la position actuelle');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une adresse..."
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                searchAddresses(text);
              }}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isSearching}
            >
              <Ionicons 
                name={isSearching ? "reload" : "location"} 
                size={20} 
                color={Colors.light.primary}
              />
            </TouchableOpacity>
          </View>

          {isSearching && (
            <Text style={styles.searchingText}>Recherche...</Text>
          )}

          <ScrollView style={styles.resultsList}>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resultItem}
                onPress={() => handleSelectAddress(result)}
              >
                <Ionicons name="location" size={20} color={Colors.light.primary} />
                <Text style={styles.resultText}>{result.address || searchText}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Option de saisie manuelle */}
            {searchText.length >= 3 && searchResults.length === 0 && !isSearching && (
              <TouchableOpacity
                style={styles.manualEntryItem}
                onPress={handleManualEntry}
              >
                <Ionicons name="pencil" size={20} color="#666" />
                <View style={styles.manualEntryContent}>
                  <Text style={styles.manualEntryText}>Utiliser cette adresse : "{searchText}"</Text>
                  <Text style={styles.manualEntrySubtext}>⚠️ Coordonnées approximatives</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>

          <Text style={styles.instructionText}>
            💡 Tapez au moins 3 caractères pour rechercher une adresse ou utilisez le bouton de géolocalisation
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default function CreateMission() {
  const router = useRouter();
  const { activeVehicles, loading: vehiclesLoading } = useVehicles();
  const { drivers, loading: driversLoading, error: driversError } = useDriversWithNotification();

  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    pickupLocation: '',
    pickupCoordinates: null as { latitude: number; longitude: number } | null,
    destination: '',
    destinationCoordinates: null as { latitude: number; longitude: number } | null,
    date: '',
    time: '',
    passengerCount: '',
    driverId: '',
    vehicleId: '',
  });

  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Initialiser la date du jour
  useEffect(() => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const timeString = today.toTimeString().slice(0, 5);
    setMissionForm(prev => ({
      ...prev,
      date: dateString,
      time: timeString
    }));
  }, []);

  useEffect(() => {
    if (driversError) {
      Alert.alert('Erreur', 'Impossible de charger la liste des conducteurs');
    }
  }, [driversError]);

  const handlePickupSelect = (address: string, coordinates: { latitude: number; longitude: number }) => {
    setMissionForm(prev => ({
      ...prev,
      pickupLocation: address,
      pickupCoordinates: coordinates
    }));
  };

  const handleDestinationSelect = (address: string, coordinates: { latitude: number; longitude: number }) => {
    setMissionForm(prev => ({
      ...prev,
      destination: address,
      destinationCoordinates: coordinates
    }));
  };

  const createMission = async () => {
    try {
      setIsCreating(true);

      // Validation des champs obligatoires
      if (!missionForm.title || !missionForm.pickupLocation || !missionForm.destination || 
          !missionForm.date || !missionForm.time || !missionForm.driverId || !missionForm.vehicleId) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Validation du nombre de passagers
      const passengerCount = parseInt(missionForm.passengerCount);
      if (isNaN(passengerCount) || passengerCount <= 0) {
        Alert.alert('Erreur', 'Le nombre de passagers doit être un nombre positif');
        return;
      }

      console.log('🚀 Début de création de mission...');

      // Utiliser les coordonnées sélectionnées ou géocoder si nécessaire
      let departureCoords = missionForm.pickupCoordinates;
      let arrivalCoords = missionForm.destinationCoordinates;

      // Géocoder si pas de coordonnées
      if (!departureCoords || !arrivalCoords) {
        try {
          if (!departureCoords) {
            departureCoords = await GeocodingService.geocodeAddress(missionForm.pickupLocation);
          }
          if (!arrivalCoords) {
            arrivalCoords = await GeocodingService.geocodeAddress(missionForm.destination);
          }
        } catch (geoError) {
          console.warn('⚠️ Erreur de géolocalisation:', geoError);
        }
      }

      // Calculer la distance si on a les deux coordonnées
      let estimatedDurationMinutes = 60; // Durée par défaut
      if (departureCoords && arrivalCoords) {
        try {
          const distance = GeocodingService.calculateDistance(
            departureCoords.latitude,
            departureCoords.longitude,
            arrivalCoords.latitude,
            arrivalCoords.longitude
          );
          // Estimation: 50 km/h de vitesse moyenne pour un bus
          estimatedDurationMinutes = Math.max(30, Math.round((distance / 50) * 60));
          console.log('📍 Distance calculée:', distance, 'km, durée estimée:', estimatedDurationMinutes, 'min');
        } catch (routeError) {
          console.warn('⚠️ Erreur calcul distance:', routeError);
        }
      }

      // Coordonnées par défaut si échec
      const finalDepartureCoords = departureCoords || { latitude: 0, longitude: 0 };
      const finalArrivalCoords = arrivalCoords || { latitude: 0, longitude: 0 };

      // Calculer l'heure d'arrivée estimée
      let departureTime: Date;
      let estimatedArrival: Date;
      
      try {
        departureTime = parseDateTime(missionForm.date, missionForm.time);
        validateDateBounds(departureTime);

        const durationMinutes = estimatedDurationMinutes; // Utiliser la durée calculée
        estimatedArrival = addMinutes(departureTime, durationMinutes);
        validateDateBounds(estimatedArrival);

        console.log('📅 Horaires calculés:', {
          departure: formatDateTime(departureTime),
          arrival: formatDateTime(estimatedArrival),
          duration: durationMinutes
        });
      } catch (dateError) {
        console.error('❌ Erreur de validation de date:', dateError);
        Alert.alert('Erreur', `Problème avec la date/heure: ${(dateError as Error).message}`);
        return;
      }

      // Créer la mission
      await databaseService.createMission({
        id: Date.now().toString(),
        title: missionForm.title,
        description: missionForm.description,
        status: 'PENDING',
        departureLocation: missionForm.pickupLocation,
        departureAddress: missionForm.pickupLocation,
        departureLat: finalDepartureCoords.latitude,
        departureLng: finalDepartureCoords.longitude,
        scheduledDepartureAt: `${missionForm.date}T${missionForm.time}:00`,
        actualDepartureAt: undefined,
        arrivalLocation: missionForm.destination,
        arrivalAddress: missionForm.destination,
        arrivalLat: finalArrivalCoords.latitude,
        arrivalLng: finalArrivalCoords.longitude,
        estimatedArrivalAt: estimatedArrival.toISOString(),
        actualArrivalAt: undefined,
        routePolyline: undefined, // Pas de polyline pour l'instant
        distance: departureCoords && arrivalCoords ? GeocodingService.calculateDistance(
          departureCoords.latitude,
          departureCoords.longitude,
          arrivalCoords.latitude,
          arrivalCoords.longitude
        ) : undefined,
        estimatedDuration: estimatedDurationMinutes,
        maxPassengers: passengerCount,
        currentPassengers: 0,
        driverId: missionForm.driverId,
        companyId: 'default-company',
        vehicleId: missionForm.vehicleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Mission créée avec succès');
      Alert.alert('Succès', 'Mission créée avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);

    } catch (error) {
      console.error('❌ Erreur création mission:', error);
      Alert.alert('Erreur', 'Impossible de créer la mission');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    const timeString = today.toTimeString().slice(0, 5);
    
    setMissionForm({
      title: '',
      description: '',
      pickupLocation: '',
      pickupCoordinates: null,
      destination: '',
      destinationCoordinates: null,
      date: dateString,
      time: timeString,
      passengerCount: '',
      driverId: '',
      vehicleId: '',
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Créer une Mission" showLogo={true} />
      
      {/* Bouton de retour */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          
          <Text style={styles.label}>Titre de la mission *</Text>
          <TextInput
            style={styles.input}
            value={missionForm.title}
            onChangeText={(text) => setMissionForm(prev => ({ ...prev, title: text }))}
            placeholder="Ex: Transport scolaire matin"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={missionForm.description}
            onChangeText={(text) => setMissionForm(prev => ({ ...prev, description: text }))}
            placeholder="Description détaillée de la mission"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Itinéraire avec sélection par carte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Itinéraire</Text>
          
          <Text style={styles.label}>Point de départ *</Text>
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
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Destination *</Text>
          <TouchableOpacity
            style={styles.addressButton}
            onPress={() => setShowDestinationPicker(true)}
          >
            <Ionicons name="location" size={20} color={Colors.light.primary} />
            <Text style={[
              styles.addressButtonText,
              !missionForm.destination && styles.placeholderText
            ]}>
              {missionForm.destination || "Sélectionner l'adresse d'arrivée"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Planning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Planning</Text>
          
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={styles.input}
            value={missionForm.date}
            onChangeText={(text) => setMissionForm(prev => ({ ...prev, date: text }))}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.label}>Heure de départ *</Text>
          <TextInput
            style={styles.input}
            value={missionForm.time}
            onChangeText={(text) => setMissionForm(prev => ({ ...prev, time: text }))}
            placeholder="HH:MM"
          />

          <Text style={styles.label}>Nombre de passagers *</Text>
          <TextInput
            style={styles.input}
            value={missionForm.passengerCount}
            onChangeText={(text) => setMissionForm(prev => ({ ...prev, passengerCount: text }))}
            placeholder="Ex: 25"
            keyboardType="numeric"
          />
        </View>

        {/* Attribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Attribution</Text>
          
          <Text style={styles.label}>Conducteur *</Text>
          {driversLoading ? (
            <Text style={styles.loadingText}>Chargement des conducteurs...</Text>
          ) : drivers.length === 0 ? (
            <Text style={styles.errorText}>Aucun conducteur disponible</Text>
          ) : (
            <View style={styles.pickerContainer}>
              {drivers.map((driver) => (
                <TouchableOpacity
                  key={driver.id}
                  style={[
                    styles.pickerItem,
                    missionForm.driverId === driver.id && styles.pickerItemSelected
                  ]}
                  onPress={() => setMissionForm(prev => ({ ...prev, driverId: driver.id }))}
                >
                  <View style={styles.driverInfo}>
                    <Text style={[
                      styles.pickerItemText,
                      missionForm.driverId === driver.id && styles.pickerItemTextSelected
                    ]}>
                      {driver.firstName} {driver.lastName}
                    </Text>
                    <Text style={styles.driverEmail}>{driver.email}</Text>
                  </View>
                  <PhoneButton phoneNumber={driver.phoneNumber} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Véhicule *</Text>
          {vehiclesLoading ? (
            <Text style={styles.loadingText}>Chargement des véhicules...</Text>
          ) : activeVehicles.length === 0 ? (
            <Text style={styles.errorText}>Aucun véhicule disponible</Text>
          ) : (
            <View style={styles.pickerContainer}>
              {activeVehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.pickerItem,
                    missionForm.vehicleId === vehicle.id && styles.pickerItemSelected
                  ]}
                  onPress={() => setMissionForm(prev => ({ ...prev, vehicleId: vehicle.id }))}
                >
                  <Text style={[
                    styles.pickerItemText,
                    missionForm.vehicleId === vehicle.id && styles.pickerItemTextSelected
                  ]}>
                    {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleCapacity}>
                    Capacité: {vehicle.registrationDocument.seats} places
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Réinitialiser"
            onPress={resetForm}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title={isCreating ? "Création..." : "Créer la mission"}
            onPress={createMission}
            style={styles.actionButton}
            disabled={isCreating}
          />
        </View>
      </ScrollView>

      {/* Modales de sélection d'adresse */}
      <AddressPicker
        visible={showPickupPicker}
        onClose={() => setShowPickupPicker(false)}
        onSelectAddress={handlePickupSelect}
        title="Sélectionner le point de départ"
      />

      <AddressPicker
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelectAddress={handleDestinationSelect}
        title="Sélectionner la destination"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
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
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: Colors.light.text,
  },
  placeholderText: {
    color: '#999',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemSelected: {
    backgroundColor: Colors.light.primary,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  pickerItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  driverInfo: {
    flex: 1,
  },
  driverEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vehicleCapacity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    padding: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  // Styles pour la modale de sélection d'adresse
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  locationButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  resultsList: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  manualEntryItem: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  manualEntryContent: {
    flex: 1,
    marginLeft: 12,
  },
  manualEntryText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 4,
  },
  manualEntrySubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
