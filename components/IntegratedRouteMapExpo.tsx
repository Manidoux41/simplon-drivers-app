import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapView, Marker, Polyline } from 'expo-maps';
import { Ionicons } from '@expo/vector-icons';
import { RouteCalculationService, RouteResult, RoutePoint } from '../services/RouteCalculationService';
import { Colors } from '../constants/Colors';

interface IntegratedRouteMapProps {
  startPoint: RoutePoint;
  endPoint: RoutePoint;
  startAddress?: string;
  endAddress?: string;
  onRouteCalculated?: (route: RouteResult) => void;
  editable?: boolean;
  onEditRoute?: () => void;
  style?: any;
}

export function IntegratedRouteMapExpo({
  startPoint,
  endPoint,
  startAddress = 'Départ',
  endAddress = 'Arrivée',
  onRouteCalculated,
  editable = false,
  onEditRoute,
  style,
}: IntegratedRouteMapProps) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Calculer la région pour afficher les deux points
  const getMapRegion = () => {
    const latDelta = Math.abs(startPoint.latitude - endPoint.latitude) * 1.5;
    const lonDelta = Math.abs(startPoint.longitude - endPoint.longitude) * 1.5;
    
    return {
      latitude: (startPoint.latitude + endPoint.latitude) / 2,
      longitude: (startPoint.longitude + endPoint.longitude) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lonDelta, 0.01),
    };
  };

  const calculateRoute = async () => {
    setLoading(true);
    setMapError(null);
    
    try {
      console.log('🗺️ Calcul de l\'itinéraire...');
      const calculatedRoute = await RouteCalculationService.calculateRoute(
        startPoint,
        endPoint,
        'driving-car'
      );
      
      if (calculatedRoute) {
        setRoute(calculatedRoute);
        onRouteCalculated?.(calculatedRoute);
        console.log('✅ Itinéraire calculé avec succès');
      } else {
        throw new Error('Aucun itinéraire trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur calcul itinéraire:', error);
      setMapError('Erreur lors du calcul de l\'itinéraire');
      Alert.alert(
        'Erreur',
        'Impossible de calculer l\'itinéraire. Vérifiez votre connexion internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRoute();
  }, [startPoint.latitude, startPoint.longitude, endPoint.latitude, endPoint.longitude]);

  const openInExternalApp = () => {
    Alert.alert(
      'Ouvrir dans une app de navigation',
      'Choisissez votre application préférée :',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = `https://www.google.com/maps/dir/${startPoint.latitude},${startPoint.longitude}/${endPoint.latitude},${endPoint.longitude}`;
            // Linking.openURL(url);
            console.log('🔗 Ouverture Google Maps:', url);
          }
        },
        {
          text: 'Apple Plans',
          onPress: () => {
            const url = `http://maps.apple.com/?saddr=${startPoint.latitude},${startPoint.longitude}&daddr=${endPoint.latitude},${endPoint.longitude}&dirflg=d`;
            // Linking.openURL(url);
            console.log('🔗 Ouverture Apple Plans:', url);
          }
        },
        { text: 'Annuler', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* En-tête avec informations de l'itinéraire */}
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>
            {startAddress} → {endAddress}
          </Text>
          
          {route && !loading && (
            <View style={styles.routeStats}>
              <View style={styles.statItem}>
                <Ionicons name="car" size={16} color={Colors.primary} />
                <Text style={styles.statText}>{route.summary.totalDistance}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={Colors.primary} />
                <Text style={styles.statText}>{route.summary.totalDuration}</Text>
              </View>
              {route.summary.fuelCost && (
                <View style={styles.statItem}>
                  <Ionicons name="car" size={16} color={Colors.primary} />
                  <Text style={styles.statText}>{route.summary.fuelCost}</Text>
                </View>
              )}
            </View>
          )}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Calcul en cours...</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          {editable && onEditRoute && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEditRoute}
            >
              <Ionicons name="pencil" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openInExternalApp}
          >
            <Ionicons name="navigate" size={20} color={Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={calculateRoute}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color={loading ? '#ccc' : Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Carte avec expo-maps */}
      <View style={styles.mapContainer}>
        {mapError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color="#ff6b35" />
            <Text style={styles.errorText}>{mapError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={calculateRoute}>
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={getMapRegion()}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
          >
            {/* Marqueur de départ */}
            <Marker
              coordinate={startPoint}
              title={startAddress}
              description="Point de départ"
              pinColor="green"
            />
            
            {/* Marqueur d'arrivée */}
            <Marker
              coordinate={endPoint}
              title={endAddress}
              description="Point d'arrivée"
              pinColor="red"
            />
            
            {/* Polyline de l'itinéraire */}
            {route && route.coordinates && route.coordinates.length > 0 && (
              <Polyline
                coordinates={route.coordinates}
                strokeColor={Colors.primary}
                strokeWidth={4}
                strokePattern={[1]}
              />
            )}
          </MapView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  routeInfo: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapContainer: {
    height: 300,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
