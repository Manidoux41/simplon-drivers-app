import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { AddressPickerWithMap, AddressPickerResult } from './AddressPickerWithMap';
import { EnhancedAddressPicker } from './EnhancedAddressPicker';

export interface RouteWaypoint {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'departure' | 'waypoint' | 'destination';
  order: number;
}

interface MultiStepRouteBuilderProps {
  waypoints?: RouteWaypoint[];
  initialWaypoints?: RouteWaypoint[];
  onWaypointsChange: (waypoints: RouteWaypoint[]) => void;
  maxWaypoints?: number;
}

export function MultiStepRouteBuilder({
  waypoints: propWaypoints,
  initialWaypoints = [],
  onWaypointsChange,
  maxWaypoints = 8
}: MultiStepRouteBuilderProps) {
  const [waypoints, setWaypoints] = useState<RouteWaypoint[]>(propWaypoints || initialWaypoints);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState<RouteWaypoint | null>(null);
  const colors = Colors.light;

  // Créer une clé stable pour les props
  const propsKey = useMemo(() => {
    if (propWaypoints) {
      return propWaypoints.map(w => `${w.id}-${w.latitude}-${w.longitude}-${w.order}`).join('|');
    }
    return 'none';
  }, [propWaypoints]);

  const initialKey = useMemo(() => {
    return initialWaypoints.map(w => `${w.id}-${w.latitude}-${w.longitude}-${w.order}`).join('|');
  }, [initialWaypoints]);

  // Synchroniser avec les props ou initialWaypoints
  useEffect(() => {
    if (propWaypoints) {
      setWaypoints(propWaypoints);
    } else if (initialWaypoints.length > 0 && waypoints.length === 0) {
      setWaypoints(initialWaypoints);
    }
  }, [propsKey, initialKey]);

  // Callback mémorisé pour notifier les changements
  const notifyWaypointsChange = useCallback((newWaypoints: RouteWaypoint[]) => {
    onWaypointsChange(newWaypoints);
  }, [onWaypointsChange]);

  // Notifier les changements
  useEffect(() => {
    notifyWaypointsChange(waypoints);
  }, [waypoints, notifyWaypointsChange]);

  const generateId = () => `waypoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addWaypoint = useCallback(() => {
    if (waypoints.length >= maxWaypoints) {
      Alert.alert('Limite atteinte', `Vous ne pouvez ajouter que ${maxWaypoints} étapes maximum.`);
      return;
    }

    // Déterminer le type et l'ordre automatiquement
    let type: RouteWaypoint['type'] = 'waypoint';
    let order = waypoints.length;

    if (waypoints.length === 0) {
      type = 'departure';
    } else if (waypoints.length === 1) {
      type = 'destination';
    } else {
      // Insérer avant la destination
      order = waypoints.length - 1;
      // Mettre à jour l'ordre de la destination
      setWaypoints(prev => prev.map(w => 
        w.type === 'destination' ? { ...w, order: order + 1 } : w
      ));
    }

    const newWaypoint: RouteWaypoint = {
      id: generateId(),
      address: '',
      latitude: 0,
      longitude: 0,
      type,
      order
    };

    setEditingWaypoint(newWaypoint);
    setShowAddressPicker(true);
  }, [waypoints, maxWaypoints]);

  const editWaypoint = useCallback((waypoint: RouteWaypoint) => {
    setEditingWaypoint(waypoint);
    setShowAddressPicker(true);
  }, []);

  const removeWaypoint = useCallback((waypointId: string) => {
    const waypointToRemove = waypoints.find(w => w.id === waypointId);
    
    if (waypointToRemove?.type === 'departure' || waypointToRemove?.type === 'destination') {
      Alert.alert('Impossible', 'Vous ne pouvez pas supprimer le point de départ ou d\'arrivée.');
      return;
    }

    Alert.alert(
      'Supprimer l\'étape',
      'Êtes-vous sûr de vouloir supprimer cette étape ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedWaypoints = waypoints
              .filter(w => w.id !== waypointId)
              .map((w, index) => ({ ...w, order: index }));
            onWaypointsChange(updatedWaypoints);
          }
        }
      ]
    );
  }, [waypoints, onWaypointsChange]);

  const handleAddressSelected = useCallback((result: AddressPickerResult) => {
    if (!editingWaypoint) return;

    const updatedWaypoint: RouteWaypoint = {
      ...editingWaypoint,
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude
    };

    if (editingWaypoint.address === '') {
      // Nouveau waypoint
      const updatedWaypoints = [...waypoints, updatedWaypoint]
        .sort((a, b) => a.order - b.order)
        .map((w, index) => ({ ...w, order: index }));
      onWaypointsChange(updatedWaypoints);
    } else {
      // Modification d'un waypoint existant
      const updatedWaypoints = waypoints.map(w => 
        w.id === updatedWaypoint.id ? updatedWaypoint : w
      );
      onWaypointsChange(updatedWaypoints);
    }

    setEditingWaypoint(null);
    setShowAddressPicker(false);
  }, [editingWaypoint, waypoints, onWaypointsChange]);

  const moveWaypoint = useCallback((waypointId: string, direction: 'up' | 'down') => {
    const currentIndex = waypoints.findIndex(w => w.id === waypointId);
    const waypoint = waypoints[currentIndex];
    
    if (waypoint.type === 'departure' || waypoint.type === 'destination') {
      return; // Ne pas permettre de déplacer le départ ou l'arrivée
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 1 || newIndex >= waypoints.length - 1) {
      return; // Ne pas dépasser les limites (en gardant départ en premier et arrivée en dernier)
    }

    const updatedWaypoints = [...waypoints];
    [updatedWaypoints[currentIndex], updatedWaypoints[newIndex]] = 
    [updatedWaypoints[newIndex], updatedWaypoints[currentIndex]];

    // Réordonner les indices
    const reorderedWaypoints = updatedWaypoints.map((w, index) => ({ ...w, order: index }));
    onWaypointsChange(reorderedWaypoints);
  }, [waypoints, onWaypointsChange]);

  const getWaypointIcon = (type: RouteWaypoint['type']) => {
    switch (type) {
      case 'departure': return 'play-circle';
      case 'destination': return 'flag';
      case 'waypoint': return 'location';
    }
  };

  const getWaypointColor = (type: RouteWaypoint['type']) => {
    switch (type) {
      case 'departure': return colors.success;
      case 'destination': return colors.error;
      case 'waypoint': return colors.info;
    }
  };

  const renderWaypoint = ({ item, index }: { item: RouteWaypoint; index: number }) => (
    <View style={[styles.waypointCard, { backgroundColor: colors.card }]}>
      <View style={styles.waypointHeader}>
        <View style={styles.waypointInfo}>
          <Ionicons 
            name={getWaypointIcon(item.type)} 
            size={20} 
            color={getWaypointColor(item.type)} 
          />
          <Text style={[styles.waypointIndex, { color: colors.textSecondary }]}>
            {index + 1}.
          </Text>
          <Text style={[styles.waypointType, { color: colors.text }]}>
            {item.type === 'departure' ? 'Départ' : 
             item.type === 'destination' ? 'Arrivée' : 
             'Étape'}
          </Text>
        </View>
        
        {item.type === 'waypoint' && (
          <View style={styles.waypointActions}>
            {index > 1 && (
              <TouchableOpacity
                onPress={() => moveWaypoint(item.id, 'up')}
                style={styles.actionButton}
              >
                <Ionicons name="chevron-up" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            {index < waypoints.length - 2 && (
              <TouchableOpacity
                onPress={() => moveWaypoint(item.id, 'down')}
                style={styles.actionButton}
              >
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => removeWaypoint(item.id)}
              style={styles.actionButton}
            >
              <Ionicons name="trash" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.waypointAddress, { backgroundColor: colors.background }]}
        onPress={() => editWaypoint(item)}
      >
        <Text style={[
          styles.addressText, 
          { color: item.address ? colors.text : colors.textSecondary }
        ]}>
          {item.address || 'Toucher pour sélectionner une adresse'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const canAddMoreWaypoints = waypoints.length < maxWaypoints;
  const hasValidRoute = waypoints.length >= 2 && 
    waypoints.every(w => w.address && w.latitude && w.longitude);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          🗺️ Itinéraire de la mission
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {waypoints.length} étape{waypoints.length > 1 ? 's' : ''} • 
          {canAddMoreWaypoints ? ` ${maxWaypoints - waypoints.length} possible${maxWaypoints - waypoints.length > 1 ? 's' : ''}` : ' Maximum atteint'}
        </Text>
      </View>

      {/* Instructions si pas de waypoints */}
      {waypoints.length === 0 && (
        <View style={[styles.instructionsContainer, { backgroundColor: colors.info + '15' }]}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <Text style={[styles.instructionsText, { color: colors.info }]}>
            Commencez par ajouter un point de départ, puis ajoutez votre destination et des étapes intermédiaires si nécessaire.
          </Text>
        </View>
      )}

      <View style={styles.waypointsList}>
        {waypoints.sort((a, b) => a.order - b.order).map((waypoint, index, sortedArray) => (
          <View key={waypoint.id}>
            {renderWaypoint({ item: waypoint, index })}
            {index < sortedArray.length - 1 && (
              <View style={styles.routeConnector}>
                <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
              </View>
            )}
          </View>
        ))}
      </View>

      {canAddMoreWaypoints && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={addWaypoint}
        >
          <Ionicons name="add" size={20} color={colors.textOnPrimary} />
          <Text style={[styles.addButtonText, { color: colors.textOnPrimary }]}>
            {waypoints.length === 0 ? 'Ajouter le point de départ' :
             waypoints.length === 1 ? 'Ajouter la destination' :
             'Ajouter une étape intermédiaire'}
          </Text>
        </TouchableOpacity>
      )}

      {hasValidRoute && (
        <View style={[styles.routeInfo, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[styles.routeInfoText, { color: colors.success }]}>
            Itinéraire prêt pour le calcul
          </Text>
        </View>
      )}

      {/* Modal de sélection d'adresse */}
      <Modal
        visible={showAddressPicker && editingWaypoint !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {editingWaypoint && (
          <EnhancedAddressPicker
            onAddressSelected={handleAddressSelected}
            onCancel={() => {
              setEditingWaypoint(null);
              setShowAddressPicker(false);
            }}
            title={`Sélectionner ${
              editingWaypoint.type === 'departure' ? 'le point de départ' :
              editingWaypoint.type === 'destination' ? 'la destination' :
              'une étape'
            }`}
            placeholder="Tapez l'adresse complète (rue, ville...)"
            initialAddress={editingWaypoint.address}
            initialCoordinates={
              editingWaypoint.latitude && editingWaypoint.longitude
                ? { latitude: editingWaypoint.latitude, longitude: editingWaypoint.longitude }
                : undefined
            }
            showMap={true}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  waypointsList: {
    flex: 1,
  },
  waypointCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  waypointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waypointInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waypointIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 4,
  },
  waypointType: {
    fontSize: 14,
    fontWeight: '600',
  },
  waypointActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  waypointAddress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  routeConnector: {
    alignItems: 'center',
    height: 20,
  },
  connectorLine: {
    width: 2,
    height: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
