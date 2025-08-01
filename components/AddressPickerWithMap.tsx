import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GeocodingService } from '../services/GeocodingService';
import { FrenchCityAPI, FrenchCityResult } from '../services/FrenchCityAPI';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

export interface AddressPickerResult {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  postalCode?: string;
}

interface AddressPickerWithMapProps {
  onAddressSelected: (result: AddressPickerResult) => void;
  onCancel: () => void;
  placeholder?: string;
  title?: string;
  initialAddress?: string;
  initialCoordinates?: { latitude: number; longitude: number };
}

export function AddressPickerWithMap({
  onAddressSelected,
  onCancel,
  placeholder = "Rechercher une adresse...",
  title = "Sélectionner une adresse",
  initialAddress = "",
  initialCoordinates
}: AddressPickerWithMapProps) {
  const [searchText, setSearchText] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FrenchCityResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(initialCoordinates ? {
    ...initialCoordinates,
    address: initialAddress
  } : null);
  const [mapRegion, setMapRegion] = useState({
    latitude: initialCoordinates?.latitude || 48.8566,
    longitude: initialCoordinates?.longitude || 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchText.length > 2) {
      searchAddresses();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchText]);

  const searchAddresses = async () => {
    setLoading(true);
    try {
      // Rechercher dans l'API française
      const city = await FrenchCityAPI.searchCity(searchText);
      if (city) {
        setSuggestions([city]);
      } else {
        // Rechercher dans les villes par texte
        const textResult = await FrenchCityAPI.searchCityInText(searchText);
        if (textResult) {
          setSuggestions([textResult]);
        } else {
          setSuggestions([]);
        }
      }
      setShowSuggestions(true);
    } catch (error) {
      console.error('Erreur recherche adresses:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = async (cityResult: FrenchCityResult) => {
    setSearchText(cityResult.address);
    setShowSuggestions(false);
    
    const newLocation = {
      latitude: cityResult.latitude,
      longitude: cityResult.longitude,
      address: cityResult.address
    };
    
    setSelectedLocation(newLocation);
    setMapRegion({
      latitude: cityResult.latitude,
      longitude: cityResult.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Veuillez autoriser l\'accès à la localisation');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Géocodage inverse pour obtenir l'adresse
      const address = await GeocodingService.reverseGeocode(latitude, longitude);
      
      const newLocation = {
        latitude,
        longitude,
        address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      };
      
      setSelectedLocation(newLocation);
      setSearchText(newLocation.address);
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
    } finally {
      setLoading(false);
    }
  };

  const onMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    setLoading(true);
    try {
      // Géocodage inverse pour obtenir l'adresse
      const address = await GeocodingService.reverseGeocode(latitude, longitude);
      
      const newLocation = {
        latitude,
        longitude,
        address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      };
      
      setSelectedLocation(newLocation);
      setSearchText(newLocation.address);
    } catch (error) {
      console.error('Erreur géocodage inverse:', error);
      const newLocation = {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      };
      setSelectedLocation(newLocation);
      setSearchText(newLocation.address);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse');
      return;
    }

    // Extraire ville et code postal de l'adresse si possible
    const addressParts = selectedLocation.address?.split(', ') || [];
    let city = '';
    let postalCode = '';
    
    if (addressParts.length >= 2) {
      city = addressParts[0];
      const lastPart = addressParts[addressParts.length - 1];
      const postalMatch = lastPart.match(/\d{5}/);
      if (postalMatch) {
        postalCode = postalMatch[0];
      }
    }

    onAddressSelected({
      address: selectedLocation.address || searchText,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      city: city || undefined,
      postalCode: postalCode || undefined,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={placeholder}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {loading && (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <Ionicons name="location" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ScrollView style={styles.suggestionsContainer}>
          {suggestions.map((cityResult, index) => (
            <TouchableOpacity
              key={`${cityResult.cityName}-${index}`}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(cityResult)}
            >
              <Ionicons name="location-outline" size={16} color="#666" />
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionCity}>{cityResult.cityName}</Text>
                <Text style={styles.suggestionDetails}>
                  {cityResult.postalCode && `${cityResult.postalCode} - `}
                  {cityResult.population && `${cityResult.population} hab.`}
                  {cityResult.isApproximate && ' (approximatif)'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          onPress={onMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Adresse sélectionnée"
              description={selectedLocation.address}
              draggable={true}
              onDragEnd={(event: any) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                onMapPress({ nativeEvent: { coordinate: { latitude, longitude } } });
              }}
            />
          )}
        </MapView>
        
        {/* Instructions */}
        <View style={styles.mapInstructions}>
          <Text style={styles.instructionsText}>
            Appuyez sur la carte pour sélectionner une adresse
          </Text>
        </View>
      </View>

      {/* Adresse sélectionnée */}
      {selectedLocation && (
        <View style={styles.selectedAddressContainer}>
          <Ionicons name="checkmark-circle" size={20} color="green" />
          <Text style={styles.selectedAddressText}>
            {selectedLocation.address}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            !selectedLocation && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Text style={[
            styles.confirmButtonText,
            !selectedLocation && styles.confirmButtonTextDisabled
          ]}>
            Confirmer
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  locationButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    maxHeight: 200,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    gap: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionCity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  suggestionDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapInstructions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
  },
  instructionsText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 8,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
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
  confirmButtonDisabled: {
    backgroundColor: '#dee2e6',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: '#6c757d',
  },
});
