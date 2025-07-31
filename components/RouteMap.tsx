import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking } from 'react-native';
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
}

export const RouteMap: React.FC<RouteMapProps> = ({
  departureLocation,
  arrivalLocation,
  style,
  height = 200,
}) => {
  const distance = calculateDistance(departureLocation, arrivalLocation);

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${departureLocation.latitude},${departureLocation.longitude}/${arrivalLocation.latitude},${arrivalLocation.longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, style, { height }]}>
      {/* Aperçu de la carte */}
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

      {/* Informations détaillées */}
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 8,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 8,
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
