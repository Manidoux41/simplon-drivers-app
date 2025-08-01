import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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

export function IntegratedRouteMap({
  startPoint,
  endPoint,
  startAddress = 'Départ',
  endAddress = 'Arrivée',
  onRouteCalculated,
  editable = false,
  onEditRoute,
  style
}: IntegratedRouteMapProps) {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: (startPoint.latitude + endPoint.latitude) / 2,
    longitude: (startPoint.longitude + endPoint.longitude) / 2,
    latitudeDelta: Math.abs(startPoint.latitude - endPoint.latitude) + 0.02,
    longitudeDelta: Math.abs(startPoint.longitude - endPoint.longitude) + 0.02,
  });

  useEffect(() => {
    calculateRoute();
  }, [startPoint, endPoint]);

  const calculateRoute = async () => {
    setLoading(true);
    try {
      const routeResult = await RouteCalculationService.calculateRoute(
        startPoint,
        endPoint,
        'driving-car'
      );
      
      if (routeResult) {
        setRoute(routeResult);
        onRouteCalculated?.(routeResult);
        
        // Ajuster la région pour montrer tout l'itinéraire
        const latitudes = routeResult.polyline.map(p => p.latitude);
        const longitudes = routeResult.polyline.map(p => p.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        setMapRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: (maxLat - minLat) * 1.3,
          longitudeDelta: (maxLng - minLng) * 1.3,
        });
      }
    } catch (error) {
      console.error('Erreur calcul itinéraire:', error);
      Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
    } finally {
      setLoading(false);
    }
  };

  const openInExternalApp = (app: 'google' | 'waze' | 'apple') => {
    const { latitude: startLat, longitude: startLng } = startPoint;
    const { latitude: endLat, longitude: endLng } = endPoint;
    
    let url = '';
    
    switch (app) {
      case 'google':
        url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${endLat},${endLng}&navigate=yes&from=${startLat},${startLng}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${endLat},${endLng}&dirflg=d`;
        break;
    }
    
    // TODO: Utiliser Linking.openURL(url) pour ouvrir l'app externe
    console.log('Ouverture app externe:', app, url);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header avec informations de l'itinéraire */}
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>Aperçu de l'itinéraire</Text>
          {route && (
            <View style={styles.routeStats}>
              <Text style={styles.routeStat}>
                📍 {route.summary.totalDistance}
              </Text>
              <Text style={styles.routeStat}>
                🕐 {route.summary.totalDuration}
              </Text>
              {route.summary.estimatedFuelCost && (
                <Text style={styles.routeStat}>
                  ⛽ {route.summary.estimatedFuelCost.toFixed(2)}€
                </Text>
              )}
            </View>
          )}
        </View>
        
        {editable && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={onEditRoute}
          >
            <Ionicons name="create" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
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
          
          {/* Ligne de l'itinéraire */}
          {route && route.polyline && route.polyline.length > 0 && (
            <Polyline
              coordinates={route.polyline}
              strokeColor={Colors.light.primary}
              strokeWidth={4}
            />
          )}
        </MapView>
        
        {/* Indicateur de chargement */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Calcul de l'itinéraire...</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={calculateRoute}
          disabled={loading}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshButtonText}>Recalculer</Text>
        </TouchableOpacity>
        
        <View style={styles.externalApps}>
          <TouchableOpacity 
            style={styles.externalAppButton}
            onPress={() => openInExternalApp('google')}
          >
            <Text style={styles.externalAppText}>Google Maps</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.externalAppButton}
            onPress={() => openInExternalApp('waze')}
          >
            <Text style={styles.externalAppText}>Waze</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.externalAppButton}
            onPress={() => openInExternalApp('apple')}
          >
            <Text style={styles.externalAppText}>Plans</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Détails des segments (optionnel) */}
      {route && route.segments.length > 0 && (
        <View style={styles.segmentsContainer}>
          <Text style={styles.segmentsTitle}>Instructions :</Text>
          {route.segments.slice(0, 3).map((segment, index) => (
            <Text key={index} style={styles.segmentText}>
              {index + 1}. {segment.instruction} ({segment.distance.toFixed(1)} km)
            </Text>
          ))}
          {route.segments.length > 3 && (
            <Text style={styles.moreSegments}>
              ... et {route.segments.length - 3} autres étapes
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeHeader: {
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
    marginBottom: 4,
  },
  routeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  routeStat: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  mapContainer: {
    height: 250,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  externalApps: {
    flexDirection: 'row',
    gap: 8,
  },
  externalAppButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  externalAppText: {
    fontSize: 10,
    color: '#495057',
    fontWeight: '500',
  },
  segmentsContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  segmentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  segmentText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  moreSegments: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
