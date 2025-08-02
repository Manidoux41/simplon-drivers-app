import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { RouteWaypoint } from './MultiStepRouteBuilder';
import { RouteCalculationService, RoutePoint } from '../services/RouteCalculationService';

interface RoutePreviewMapProps {
  waypoints: RouteWaypoint[];
  height?: number;
  showStats?: boolean;
}

interface RouteStats {
  totalDistance: number;
  totalDuration: number;
  segments: Array<{
    from: string;
    to: string;
    distance: number;
    duration: number;
  }>;
}

export function RoutePreviewMap({
  waypoints,
  height = 300,
  showStats = true
}: RoutePreviewMapProps) {
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colors = Colors.light;

  // Créer une clé stable basée sur les waypoints pour éviter les recalculs inutiles
  const waypointsKey = useMemo(() => {
    return waypoints
      .filter(w => w.address && w.latitude && w.longitude)
      .map(w => `${w.id}-${w.latitude}-${w.longitude}-${w.order}`)
      .sort()
      .join('|');
  }, [waypoints]);

  // Mémoriser les waypoints valides pour éviter les recalculs inutiles
  const validWaypoints = useMemo(() => {
    return waypoints.filter(w => w.address && w.latitude && w.longitude);
  }, [waypointsKey]);

  // Calculer l'itinéraire quand les waypoints valides changent
  useEffect(() => {
    let isCancelled = false;

    const performCalculation = async () => {
      if (validWaypoints.length < 2) {
        setRouteCoordinates([]);
        setRouteStats(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Trier les waypoints par ordre
        const sortedWaypoints = [...validWaypoints].sort((a, b) => a.order - b.order);
        
        // Convertir en format RoutePoint
        const routePoints: RoutePoint[] = sortedWaypoints.map(w => ({
          latitude: w.latitude,
          longitude: w.longitude
        }));

        // Calculer l'itinéraire multi-étapes
        const result = await RouteCalculationService.calculateMultiStepRoute(routePoints);

        // Vérifier si le composant est toujours monté
        if (isCancelled) return;

        if (result.success && result.polyline) {
          setRouteCoordinates(result.polyline);

          // Créer les statistiques
          const segments = sortedWaypoints.slice(0, -1).map((waypoint, index) => ({
            from: waypoint.address,
            to: sortedWaypoints[index + 1].address,
            distance: result.segments?.[index]?.distance ? result.segments[index].distance * 1000 : 0, // km vers m
            duration: result.segments?.[index]?.duration || 0
          }));

          setRouteStats({
            totalDistance: result.totalDistance ? result.totalDistance * 1000 : 0, // km vers m
            totalDuration: result.totalDuration || 0,
            segments
          });
        } else {
          setError(result.error || 'Impossible de calculer l\'itinéraire');
        }

      } catch (error) {
        if (!isCancelled) {
          console.error('Erreur calcul itinéraire:', error);
          setError('Impossible de calculer l\'itinéraire');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    performCalculation();

    return () => {
      isCancelled = true;
    };
  }, [waypointsKey]);

  // Calculer la région pour afficher toute la route
  const mapRegion = useMemo(() => {
    if (validWaypoints.length === 0) {
      return {
        latitude: 47.0844,
        longitude: 2.3964,
        latitudeDelta: 5,
        longitudeDelta: 5,
      };
    }

    const latitudes = validWaypoints.map(c => c.latitude);
    const longitudes = validWaypoints.map(c => c.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const deltaLat = maxLat - minLat;
    const deltaLng = maxLng - minLng;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(deltaLat * 1.5, 0.01),
      longitudeDelta: Math.max(deltaLng * 1.5, 0.01),
    };
  }, [waypointsKey]);

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  }, []);

  const formatDistance = useCallback((meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  }, []);

  const getMarkerColor = useCallback((type: RouteWaypoint['type']) => {
    switch (type) {
      case 'departure': return '#4CAF50';
      case 'destination': return '#F44336';
      case 'waypoint': return '#2196F3';
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Carte */}
      <View style={[styles.mapContainer, { height }]}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={mapRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          toolbarEnabled={false}
        >
          {/* Marqueurs des waypoints */}
          {waypoints
            .filter(w => w.latitude && w.longitude)
            .map((waypoint, index) => (
              <Marker
                key={waypoint.id}
                coordinate={{
                  latitude: waypoint.latitude,
                  longitude: waypoint.longitude
                }}
                pinColor={getMarkerColor(waypoint.type)}
                title={`${index + 1}. ${waypoint.type === 'departure' ? 'Départ' : 
                         waypoint.type === 'destination' ? 'Arrivée' : 'Étape'}`}
                description={waypoint.address}
              />
            ))}

          {/* Tracé de l'itinéraire */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.primary}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>

        {/* Overlay de chargement */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Calcul de l'itinéraire...
              </Text>
            </View>
          </View>
        )}

        {/* Message d'erreur */}
        {error && (
          <View style={styles.errorOverlay}>
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="warning" size={24} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Statistiques de l'itinéraire */}
      {showStats && routeStats && (
        <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
          <View style={[styles.statsHeader, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Ionicons name="map" size={20} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Distance totale
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDistance(routeStats.totalDistance)}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color={colors.info} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Durée estimée
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatDuration(routeStats.totalDuration)}
              </Text>
            </View>
          </View>

          {/* Détail des segments */}
          {routeStats.segments.length > 0 && (
            <View style={[styles.segmentsContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.segmentsTitle, { color: colors.text }]}>
                Détail du trajet
              </Text>
              {routeStats.segments.map((segment, index) => (
                <View key={index} style={[styles.segment, { borderBottomColor: colors.border }]}>
                  <View style={styles.segmentHeader}>
                    <Text style={[styles.segmentIndex, { color: colors.textSecondary }]}>
                      {index + 1}.
                    </Text>
                    <Text style={[styles.segmentRoute, { color: colors.text }]}>
                      {segment.from} → {segment.to}
                    </Text>
                  </View>
                  <View style={styles.segmentStats}>
                    <Text style={[styles.segmentStat, { color: colors.textSecondary }]}>
                      {formatDistance(segment.distance)} • {formatDuration(segment.duration)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  errorOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statsContainer: {
    maxHeight: 200,
  },
  statsHeader: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  segmentsContainer: {
    borderRadius: 12,
    padding: 16,
  },
  segmentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  segment: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  segmentIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  segmentRoute: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  segmentStats: {
    marginLeft: 28,
  },
  segmentStat: {
    fontSize: 12,
  },
});
