import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { FreeRoutingService } from '../services/FreeRoutingService';
import { heavyVehicleRouteService, OptimizedRoute } from '../services/HeavyVehicleRouteService';

interface OptimizedRouteMapProps {
  departureCoords: { latitude: number; longitude: number };
  arrivalCoords: { latitude: number; longitude: number };
  departureAddress: string;
  arrivalAddress: string;
  vehicle?: any;
  onClose?: () => void;
  onRouteCalculated?: (route: OptimizedRoute) => void;
}

export const OptimizedRouteMap: React.FC<OptimizedRouteMapProps> = ({
  departureCoords,
  arrivalCoords,
  departureAddress,
  arrivalAddress,
  vehicle,
  onClose,
  onRouteCalculated
}) => {
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapHtml, setMapHtml] = useState<string>('');

  useEffect(() => {
    calculateAndDisplayRoute();
  }, [departureCoords, arrivalCoords]);

  const calculateAndDisplayRoute = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculer l'itinéraire optimisé
      let optimizedRoute: OptimizedRoute;

      if (vehicle && heavyVehicleRouteService.isHeavyVehicle(vehicle)) {
        console.log('🚛 Calcul itinéraire poids lourd pour:', vehicle.licensePlate);
        const vehicleOptions = heavyVehicleRouteService.buildVehicleOptions(vehicle);
        optimizedRoute = await heavyVehicleRouteService.calculateHeavyVehicleRoute(
          departureCoords,
          arrivalCoords,
          vehicleOptions
        );
      } else {
        console.log('🚗 Calcul itinéraire standard');
        const vehicleOptions = {
          weight: 3.5,
          height: 2.0,
          width: 2.0,
          length: 5.0,
          hazmat: false,
          avoidTolls: false,
          avoidFerries: false
        };
        optimizedRoute = await FreeRoutingService.calculateRoute(
          departureCoords,
          arrivalCoords,
          vehicleOptions
        );
      }

      setRoute(optimizedRoute);
      onRouteCalculated?.(optimizedRoute);
      
      // Générer la carte HTML avec OpenStreetMap
      const html = generateMapHtml(
        departureCoords,
        arrivalCoords,
        departureAddress,
        arrivalAddress,
        optimizedRoute
      );
      setMapHtml(html);

    } catch (routeError) {
      console.error('Erreur calcul itinéraire:', routeError);
      setError(routeError instanceof Error ? routeError.message : 'Erreur inconnue');
      
      // Afficher une carte basique sans itinéraire
      const basicHtml = generateBasicMapHtml(
        departureCoords,
        arrivalCoords,
        departureAddress,
        arrivalAddress
      );
      setMapHtml(basicHtml);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMapHtml = (
    departure: { latitude: number; longitude: number },
    arrival: { latitude: number; longitude: number },
    departureAddr: string,
    arrivalAddr: string,
    routeData: OptimizedRoute
  ): string => {
    // Convertir la polyline en coordonnées pour Leaflet
    const routeCoords = routeData.polyline
      .split('|')
      .map(point => {
        const [lat, lng] = point.split(',').map(Number);
        return [lat, lng];
      })
      .filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Itinéraire Optimisé</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #map { height: 100vh; width: 100vw; }
        .route-info {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        .route-stats {
            display: flex;
            justify-content: space-around;
            margin: 8px 0;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-weight: bold;
            color: #1E40AF;
            font-size: 16px;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
        }
        .warnings {
            margin-top: 8px;
            padding: 8px;
            background: #fef3c7;
            border-radius: 4px;
            border-left: 3px solid #d97706;
        }
        .warning {
            font-size: 12px;
            color: #92400e;
            margin: 2px 0;
        }
    </style>
</head>
<body>
    <div class="route-info">
        <div style="font-weight: bold; margin-bottom: 8px;">🗺️ Itinéraire Optimisé</div>
        <div class="route-stats">
            <div class="stat">
                <div class="stat-value">${(routeData.distance / 1000).toFixed(1)} km</div>
                <div class="stat-label">Distance</div>
            </div>
            <div class="stat">
                <div class="stat-value">${Math.round(routeData.duration / 60)} min</div>
                <div class="stat-label">Durée</div>
            </div>
            <div class="stat">
                <div class="stat-value">${routeData.warnings.length}</div>
                <div class="stat-label">Alertes</div>
            </div>
        </div>
        ${routeData.warnings.length > 0 ? `
        <div class="warnings">
            <strong>⚠️ Avertissements:</strong>
            ${routeData.warnings.slice(0, 3).map(w => `<div class="warning">• ${w}</div>`).join('')}
            ${routeData.warnings.length > 3 ? `<div class="warning">... et ${routeData.warnings.length - 3} autres</div>` : ''}
        </div>
        ` : ''}
    </div>
    
    <div id="map"></div>
    
    <script>
        // Initialiser la carte
        const map = L.map('map').setView([${departure.latitude}, ${departure.longitude}], 10);

        // Ajouter les tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Marqueur de départ (vert)
        const departureMarker = L.marker([${departure.latitude}, ${departure.longitude}], {
            icon: L.divIcon({
                html: '<div style="background: #059669; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">D</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);
        departureMarker.bindPopup('<b>🏁 Départ</b><br>${departureAddr}');

        // Marqueur d'arrivée (rouge)
        const arrivalMarker = L.marker([${arrival.latitude}, ${arrival.longitude}], {
            icon: L.divIcon({
                html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">A</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);
        arrivalMarker.bindPopup('<b>🎯 Arrivée</b><br>${arrivalAddr}');

        // Tracer l'itinéraire
        ${routeCoords.length > 1 ? `
        const routeCoords = ${JSON.stringify(routeCoords)};
        if (routeCoords.length > 0) {
            const routeLine = L.polyline(routeCoords, {
                color: '#1E40AF',
                weight: 4,
                opacity: 0.8
            }).addTo(map);
            
            // Ajuster la vue pour inclure tout l'itinéraire
            const group = new L.featureGroup([departureMarker, arrivalMarker, routeLine]);
            map.fitBounds(group.getBounds().pad(0.1));
        }` : `
        // Pas d'itinéraire disponible, ajuster la vue sur les marqueurs
        const group = new L.featureGroup([departureMarker, arrivalMarker]);
        map.fitBounds(group.getBounds().pad(0.2));
        `}
    </script>
</body>
</html>`;
  };

  const generateBasicMapHtml = (
    departure: { latitude: number; longitude: number },
    arrival: { latitude: number; longitude: number },
    departureAddr: string,
    arrivalAddr: string
  ): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Carte Mission</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
        .error-info {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            background: #fee2e2;
            padding: 10px;
            border-radius: 8px;
            border-left: 3px solid #dc2626;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="error-info">
        <strong>⚠️ Carte basique</strong><br>
        <small>Itinéraire non disponible - Points de départ et arrivée uniquement</small>
    </div>
    
    <div id="map"></div>
    
    <script>
        const map = L.map('map').setView([${departure.latitude}, ${departure.longitude}], 10);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const departureMarker = L.marker([${departure.latitude}, ${departure.longitude}], {
            icon: L.divIcon({
                html: '<div style="background: #059669; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">D</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);
        departureMarker.bindPopup('<b>🏁 Départ</b><br>${departureAddr}');

        const arrivalMarker = L.marker([${arrival.latitude}, ${arrival.longitude}], {
            icon: L.divIcon({
                html: '<div style="background: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">A</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);
        arrivalMarker.bindPopup('<b>🎯 Arrivée</b><br>${arrivalAddr}');

        const group = new L.featureGroup([departureMarker, arrivalMarker]);
        map.fitBounds(group.getBounds().pad(0.2));
    </script>
</body>
</html>`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Calcul de l'itinéraire optimisé...</Text>
        <Text style={styles.loadingSubtext}>
          {vehicle && heavyVehicleRouteService.isHeavyVehicle(vehicle) 
            ? `Véhicule poids lourd détecté (${vehicle.licensePlate})`
            : 'Véhicule standard'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close-circle" size={32} color={Colors.light.error} />
        </TouchableOpacity>
      )}
      
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={Colors.light.warning} />
          <Text style={styles.errorText}>
            Itinéraire indisponible - Affichage basique
          </Text>
        </View>
      )}

      <WebView
        source={{ html: mapHtml }}
        style={styles.webview}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <Text style={styles.webviewLoadingText}>Chargement de la carte...</Text>
          </View>
        )}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {route && (
        <View style={styles.routeSummary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{(route.distance / 1000).toFixed(1)} km</Text>
              <Text style={styles.summaryLabel}>Distance</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{Math.round(route.duration / 60)} min</Text>
              <Text style={styles.summaryLabel}>Durée</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{route.restrictions.length}</Text>
              <Text style={styles.summaryLabel}>Restrictions</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1001,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  webviewLoadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  routeSummary: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});

export default OptimizedRouteMap;