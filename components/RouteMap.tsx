import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface RouteMapProps {
  departureLocation: {
    latitude: number;
    longitude: number;
    title: string;
    address?: string;
  };
  arrivalLocation: {
    latitude: number;
    longitude: number;
    title: string;
    address?: string;
  };
  routePolyline?: string;
  style?: any;
  height?: number;
  showFullMap?: boolean;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  departureLocation,
  arrivalLocation,
  style,
  height = 200,
  showFullMap = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const distance = calculateDistance(departureLocation, arrivalLocation);

  // Générer l'URL de la carte statique OpenStreetMap
  const generateStaticMapUrl = () => {
    if (!departureLocation.latitude || !arrivalLocation.latitude) return null;

    // Calculer les paramètres de la carte
    const width = 400;
    const mapHeight = 250;
    const zoom = Math.min(12, Math.max(8, 14 - Math.log2(distance / 10))); // Zoom adaptatif selon la distance
    
    const centerLat = (departureLocation.latitude + arrivalLocation.latitude) / 2;
    const centerLng = (departureLocation.longitude + arrivalLocation.longitude) / 2;
    
    // Utilisation de l'API StaticMaps gratuite via MapProxy/OSM
    // Alternative plus simple : générer une URL vers OpenStreetMap
    try {
      // API StaticMap simple avec marqueurs
      return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${mapHeight}&maptype=mapnik&markers=${departureLocation.latitude},${departureLocation.longitude},ol-marker-green|${arrivalLocation.latitude},${arrivalLocation.longitude},ol-marker`;
    } catch (error) {
      console.warn('Erreur génération URL carte:', error);
      return null;
    }
  };

  // Charger la carte statique
  const loadStaticMap = async () => {
    if (!showFullMap) return;
    
    setLoading(true);
    setError(null);

    try {
      const mapUrl = generateStaticMapUrl();
      if (mapUrl) {
        setMapImageUrl(mapUrl);
      } else {
        setError("Impossible de générer la carte");
      }
    } catch (err) {
      console.warn('Erreur génération carte:', err);
      setError("Erreur lors du chargement de la carte");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaticMap();
  }, [departureLocation, arrivalLocation, showFullMap]);

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${departureLocation.latitude},${departureLocation.longitude}/${arrivalLocation.latitude},${arrivalLocation.longitude}`;
    Linking.openURL(url);
  };

  const openInAppleMaps = () => {
    const url = `http://maps.apple.com/?saddr=${departureLocation.latitude},${departureLocation.longitude}&daddr=${arrivalLocation.latitude},${arrivalLocation.longitude}&dirflg=d`;
    Linking.openURL(url);
  };

  if (!showFullMap) {
    // Mode placeholder pour les cas où on veut juste l'aperçu simple
    return (
      <View style={[styles.container, style, { height }]}>
        <TouchableOpacity style={styles.mapPlaceholder} onPress={openInGoogleMaps}>
          <Ionicons name="map" size={50} color={Colors.light.primary} />
          <Text style={styles.mapTitle}>Aperçu de l'itinéraire</Text>
          <Text style={styles.mapSubtitle}>
            {departureLocation.title} → {arrivalLocation.title}
          </Text>
          <Text style={styles.distanceText}>
            Distance: ~{distance} km
          </Text>
          <Text style={styles.tapToOpen}>
            Appuyez pour ouvrir dans Google Maps
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style, { height }]}>
      {/* Carte statique */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Chargement de la carte...</Text>
          </View>
        ) : error || !mapImageUrl ? (
          <TouchableOpacity style={styles.mapPlaceholder} onPress={openInGoogleMaps}>
            <Ionicons name="map" size={50} color={Colors.light.primary} />
            <Text style={styles.mapTitle}>Aperçu de l'itinéraire</Text>
            <Text style={styles.mapSubtitle}>
              {departureLocation.title} → {arrivalLocation.title}
            </Text>
            <Text style={styles.distanceText}>
              Distance: ~{distance} km
            </Text>
            <Text style={styles.tapToOpen}>
              Appuyez pour ouvrir dans Google Maps
            </Text>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={openInGoogleMaps} style={styles.mapImageContainer}>
            <Image 
              source={{ uri: mapImageUrl }} 
              style={styles.mapImage}
              resizeMode="cover"
            />
            <View style={styles.mapOverlay}>
              <View style={styles.mapHeader}>
                <Text style={styles.mapTitle}>Itinéraire OpenStreetMap</Text>
                <View style={styles.mapActions}>
                  <TouchableOpacity onPress={openInAppleMaps} style={styles.actionButton}>
                    <Ionicons name="navigate" size={16} color={Colors.light.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openInGoogleMaps} style={styles.actionButton}>
                    <Ionicons name="open-outline" size={16} color={Colors.light.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.distanceText}>
                Distance: ~{distance} km
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Informations détaillées en bas */}
      <View style={styles.routeInfo}>
        <View style={styles.locationPoint}>
          <View style={[styles.locationDot, { backgroundColor: Colors.light.success }]} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationTitle}>{departureLocation.title}</Text>
            <Text style={styles.locationAddress}>{departureLocation.address}</Text>
          </View>
        </View>
        
        <View style={styles.routeLine} />
        
        <View style={styles.locationPoint}>
          <View style={[styles.locationDot, { backgroundColor: Colors.light.error }]} />
          <View style={styles.locationDetails}>
            <Text style={styles.locationTitle}>{arrivalLocation.title}</Text>
            <Text style={styles.locationAddress}>{arrivalLocation.address}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Fonction utilitaire pour calculer la distance
function calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * 
    Math.cos(toRadians(point2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Arrondi à 2 décimales
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  mapImageContainer: {
    flex: 1,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mapActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  distanceText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  tapToOpen: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  routeInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  locationDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  locationAddress: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.light.primary,
    marginLeft: 3,
    marginVertical: 2,
  },
});
