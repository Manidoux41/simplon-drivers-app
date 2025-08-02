import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { FrenchAddressAPI, SearchSuggestion } from '../services/FrenchAddressAPI';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

export interface AddressPickerResult {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  postalCode?: string;
}

interface EnhancedAddressPickerProps {
  onAddressSelected: (result: AddressPickerResult) => void;
  onCancel: () => void;
  placeholder?: string;
  title?: string;
  initialAddress?: string;
  initialCoordinates?: { latitude: number; longitude: number };
  showMap?: boolean;
}

export function EnhancedAddressPicker({
  onAddressSelected,
  onCancel,
  placeholder = "Rechercher une adresse complète...",
  title = "Sélectionner une adresse",
  initialAddress = "",
  initialCoordinates,
  showMap = true
}: EnhancedAddressPickerProps) {
  const [searchText, setSearchText] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
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
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = Colors.light;

  useEffect(() => {
    // Débounce la recherche
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchText.length > 2) {
      searchTimeout.current = setTimeout(() => {
        searchAddresses();
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchText]);

  const searchAddresses = async () => {
    setLoading(true);
    try {
      console.log('🔍 Recherche pour:', searchText);
      let results = await FrenchAddressAPI.searchAddresses(searchText, 8);
      
      // Si pas de résultats, essayer une recherche fuzzy
      if (results.length === 0 && searchText.length > 4) {
        console.log('🔄 Tentative recherche fuzzy...');
        results = await FrenchAddressAPI.fuzzySearch(searchText, 5);
      }
      
      setSuggestions(results);
      setShowSuggestions(true);
      console.log('✅ Résultats:', results.length);
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      setSuggestions([]);
      // Afficher un message d'erreur à l'utilisateur
      if (searchText.length > 3) {
        setSuggestions([{
          id: 'error',
          address: `Aucun résultat pour "${searchText}"`,
          latitude: 0,
          longitude: 0,
          city: '',
          postalCode: '',
          context: 'Essayez une adresse plus précise',
          score: 0
        }]);
        setShowSuggestions(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    // Ne pas sélectionner les suggestions d'erreur
    if (suggestion.id === 'error' || suggestion.latitude === 0) {
      return;
    }
    
    setSearchText(suggestion.address);
    setSelectedLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address
    });
    setMapRegion({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
    setShowSuggestions(false);
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Sélection immédiate de la position
    const tempAddress = `Position ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    setSelectedLocation({
      latitude,
      longitude,
      address: tempAddress
    });
    setSearchText(tempAddress);

    // Géocodage inverse pour obtenir l'adresse réelle
    setLoading(true);
    try {
      const result = await FrenchAddressAPI.reverseGeocode(latitude, longitude);
      if (result && result.address && result.address !== tempAddress) {
        setSearchText(result.address);
        setSelectedLocation({
          latitude,
          longitude,
          address: result.address
        });
      }
    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      // Garder la position temporaire
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la localisation');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Géocodage inverse
      const result = await FrenchAddressAPI.reverseGeocode(latitude, longitude);
      if (result) {
        setSearchText(result.address);
        setSelectedLocation({
          latitude,
          longitude,
          address: result.address
        });
      }

    } catch (error) {
      console.error('❌ Erreur localisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position');
    } finally {
      setLoading(false);
    }
  };

  const confirmSelection = () => {
    if (!selectedLocation) {
      Alert.alert('Erreur', 'Veuillez sélectionner une adresse');
      return;
    }

    onAddressSelected({
      address: selectedLocation.address || searchText,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      city: suggestions.find(s => s.latitude === selectedLocation.latitude)?.city,
      postalCode: suggestions.find(s => s.latitude === selectedLocation.latitude)?.postalCode,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <TouchableOpacity 
          onPress={confirmSelection} 
          style={[styles.confirmButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.confirmButtonText}>OK</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchText}
            onChangeText={setSearchText}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        <TouchableOpacity 
          onPress={getCurrentLocation} 
          style={[styles.locationButton, { backgroundColor: colors.info }]}
        >
          <Ionicons name="locate" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.card }]}>
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <TouchableOpacity
              key={suggestion.id || index}
              style={[
                styles.suggestionItem, 
                { borderBottomColor: colors.border },
                suggestion.id === 'error' && { opacity: 0.7 }
              ]}
              onPress={() => selectSuggestion(suggestion)}
              disabled={suggestion.id === 'error'}
            >
              <Ionicons 
                name={suggestion.id === 'error' ? "alert-circle-outline" : "location-outline"} 
                size={16} 
                color={suggestion.id === 'error' ? colors.textSecondary : colors.primary} 
              />
              <View style={styles.suggestionContent}>
                <Text style={[
                  styles.suggestionAddress, 
                  { color: suggestion.id === 'error' ? colors.textSecondary : colors.text }
                ]}>
                  {suggestion.address}
                </Text>
                <Text style={[styles.suggestionContext, { color: colors.textSecondary }]}>
                  {suggestion.context}
                </Text>
              </View>
              {suggestion.id !== 'error' && (
                <View style={styles.suggestionScore}>
                  <Text style={[styles.scoreText, { color: colors.textSecondary }]}>
                    {Math.round(suggestion.score * 100)}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Carte */}
      {showMap && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude
                }}
                title="Adresse sélectionnée"
                description={selectedLocation.address}
                pinColor={colors.primary}
              />
            )}
          </MapView>
          
          {/* Instructions */}
          <View style={[styles.mapInstructions, { backgroundColor: colors.card + 'E6' }]}>
            <Text style={[styles.instructionsText, { color: colors.text }]}>
              Tapez sur la carte pour sélectionner une position
            </Text>
          </View>
        </View>
      )}

      {/* Adresse sélectionnée */}
      {selectedLocation && (
        <View style={[styles.selectedContainer, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.selectedText, { color: colors.success }]}>
            {selectedLocation.address}
          </Text>
        </View>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionAddress: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionContext: {
    fontSize: 14,
  },
  suggestionScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapInstructions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
