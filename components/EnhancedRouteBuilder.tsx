import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { MultiStepRouteBuilder, RouteWaypoint } from './MultiStepRouteBuilder';
import { RoutePreviewMap } from './RoutePreviewMap';
import { RouteBuilderHelp } from './RouteBuilderHelp';

interface EnhancedRouteBuilderProps {
  initialDeparture?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  initialDestination?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  onRouteChange?: (waypoints: RouteWaypoint[]) => void;
  onRouteStatsChange?: (stats: {
    totalDistance: number;
    totalDuration: number;
  }) => void;
}

export function EnhancedRouteBuilder({
  initialDeparture,
  initialDestination,
  onRouteChange,
  onRouteStatsChange
}: EnhancedRouteBuilderProps) {
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>([]);
  const [showRouteBuilder, setShowRouteBuilder] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const colors = Colors.light;

  // Créer une clé stable pour les props initiales
  const initialKey = useMemo(() => {
    const depKey = initialDeparture ? `${initialDeparture.latitude}-${initialDeparture.longitude}` : 'none';
    const destKey = initialDestination ? `${initialDestination.latitude}-${initialDestination.longitude}` : 'none';
    return `${depKey}|${destKey}`;
  }, [initialDeparture, initialDestination]);

  // Initialiser les waypoints à partir des props
  useEffect(() => {
    const initialWaypoints: RouteWaypoint[] = [];

    if (initialDeparture) {
      initialWaypoints.push({
        id: 'departure',
        type: 'departure',
        address: initialDeparture.address,
        latitude: initialDeparture.latitude,
        longitude: initialDeparture.longitude,
        order: 0
      });
    }

    if (initialDestination) {
      initialWaypoints.push({
        id: 'destination',
        type: 'destination',
        address: initialDestination.address,
        latitude: initialDestination.latitude,
        longitude: initialDestination.longitude,
        order: initialWaypoints.length
      });
    }

    if (initialWaypoints.length > 0) {
      setWaypoints(initialWaypoints);
    }
  }, [initialKey]);

  // Notifier les changements avec useCallback pour éviter les re-renders
  const notifyRouteChange = useCallback((newWaypoints: RouteWaypoint[]) => {
    onRouteChange?.(newWaypoints);
  }, [onRouteChange]);

  useEffect(() => {
    notifyRouteChange(waypoints);
  }, [waypoints, notifyRouteChange]);

  const handleWaypointsChange = useCallback((newWaypoints: RouteWaypoint[]) => {
    setWaypoints(newWaypoints);
  }, []);

  const handleRouteStatsChange = useCallback((stats: { totalDistance: number; totalDuration: number }) => {
    onRouteStatsChange?.(stats);
  }, [onRouteStatsChange]);

  const getRouteDescription = useCallback(() => {
    if (waypoints.length < 2) {
      return 'Aucun itinéraire défini';
    }

    const sortedWaypoints = [...waypoints].sort((a, b) => a.order - b.order);
    const departure = sortedWaypoints[0];
    const destination = sortedWaypoints[sortedWaypoints.length - 1];
    const intermediateStops = sortedWaypoints.slice(1, -1);

    let description = `${departure.address} → ${destination.address}`;
    
    if (intermediateStops.length > 0) {
      description += ` (${intermediateStops.length} étape${intermediateStops.length > 1 ? 's' : ''})`;
    }

    return description;
  }, [waypoints]);

  const toggleRouteBuilder = useCallback(() => {
    setShowRouteBuilder(prev => !prev);
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header avec contrôles */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="map" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Itinéraire
          </Text>
        </View>
        
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: showHelp ? colors.info : 'transparent' }
            ]}
            onPress={() => setShowHelp(true)}
          >
            <Ionicons 
              name="help-circle" 
              size={18} 
              color={showHelp ? '#fff' : colors.info} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: showPreview ? colors.primary : 'transparent' }
            ]}
            onPress={togglePreview}
          >
            <Ionicons 
              name="eye" 
              size={18} 
              color={showPreview ? '#fff' : colors.textSecondary} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: showRouteBuilder ? colors.primary : 'transparent' }
            ]}
            onPress={toggleRouteBuilder}
          >
            <Ionicons 
              name="add" 
              size={18} 
              color={showRouteBuilder ? '#fff' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Description de l'itinéraire */}
      <View style={[styles.descriptionContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.routeDescription, { color: colors.textSecondary }]}>
          {getRouteDescription()}
        </Text>
        {waypoints.length > 2 && (
          <Text style={[styles.waypointCount, { color: colors.info }]}>
            {waypoints.length - 2} étape{waypoints.length - 2 > 1 ? 's' : ''} intermédiaire{waypoints.length - 2 > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Constructor d'itinéraire */}
      {showRouteBuilder && (
        <View style={[styles.builderContainer, { backgroundColor: colors.card }]}>
          <MultiStepRouteBuilder
            waypoints={waypoints}
            onWaypointsChange={handleWaypointsChange}
            maxWaypoints={8}
          />
        </View>
      )}

      {/* Prévisualisation de l'itinéraire */}
      {showPreview && waypoints.length >= 2 && (
        <View style={styles.previewContainer}>
          <RoutePreviewMap
            waypoints={waypoints}
            height={300}
            showStats={true}
          />
        </View>
      )}

      {/* Actions rapides */}
      {waypoints.length >= 2 && (
        <View style={[styles.actionsContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.info + '15' }]}
            onPress={() => {
              // TODO: Optimiser l'ordre des waypoints
              Alert.alert(
                'Optimisation',
                'Fonctionnalité d\'optimisation de l\'ordre des étapes à venir',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="analytics" size={20} color={colors.info} />
            <Text style={[styles.actionButtonText, { color: colors.info }]}>
              Optimiser
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '15' }]}
            onPress={() => {
              Alert.alert(
                'Réinitialiser',
                'Voulez-vous réinitialiser l\'itinéraire ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { 
                    text: 'Réinitialiser', 
                    style: 'destructive',
                    onPress: () => setWaypoints([])
                  }
                ]
              );
            }}
          >
            <Ionicons name="refresh" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>
              Réinitialiser
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Guide d'aide */}
      <RouteBuilderHelp
        visible={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  descriptionContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  routeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  waypointCount: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  builderContainer: {
    maxHeight: 400,
  },
  previewContainer: {
    padding: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
