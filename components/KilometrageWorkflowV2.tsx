import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { databaseService, Mission, Vehicle } from '../lib/database';
import { KilometrageDepotStart } from './KilometrageDepotStart';
import { KilometrageMissionStart } from './KilometrageMissionStart';
import { KilometrageMissionEnd } from './KilometrageMissionEnd';

interface KilometrageWorkflowV2Props {
  missionId: string;
  onClose: () => void;
  onMissionUpdated: () => void;
}

export function KilometrageWorkflowV2({
  missionId,
  onClose,
  onMissionUpdated
}: KilometrageWorkflowV2Props) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const colors = Colors.light;

  useEffect(() => {
    loadMission();
  }, [missionId]);

  const loadMission = async () => {
    try {
      setLoading(true);
      const missionData = await databaseService.getMissionById(missionId);
      setMission(missionData);
      
      // Load vehicle info if available
      if (missionData?.vehicleId) {
        const vehicleData = await databaseService.getVehicleById(missionData.vehicleId);
        setVehicle(vehicleData);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données de la mission');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePhaseComplete = async () => {
    await loadMission(); // Reload mission data to get latest state
    onMissionUpdated(); // Notify parent to refresh
  };

  const getCurrentPhase = () => {
    if (!mission) return 'loading';
    
    // Phase 1: Mission not started yet (no kmDepotStart)
    if (!mission.kmDepotStart) {
      return 'depot-start';
    }
    
    // Phase 2: Mission started but no mission start km recorded yet
    if (mission.kmDepotStart && !mission.kmMissionStart) {
      return 'mission-start';
    }
    
    // Phase 3: Mission start recorded but not completed
    if (mission.kmMissionStart && (!mission.kmMissionEnd || !mission.kmDepotEnd)) {
      return 'mission-end';
    }
    
    // Completed: All km values recorded
    return 'completed';
  };

  const getVehicleInfo = () => {
    if (!vehicle) return undefined;
    return `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement...
        </Text>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Mission introuvable
        </Text>
      </View>
    );
  }

  const currentPhase = getCurrentPhase();

  switch (currentPhase) {
    case 'depot-start':
      return (
        <KilometrageDepotStart
          missionId={missionId}
          missionTitle={mission.title || 'Mission sans titre'}
          vehicleInfo={getVehicleInfo()}
          onSuccess={handlePhaseComplete}
          onCancel={onClose}
        />
      );

    case 'mission-start':
      return (
        <KilometrageMissionStart
          missionId={missionId}
          missionTitle={mission.title || 'Mission sans titre'}
          kmDepotStart={mission.kmDepotStart!}
          vehicleInfo={getVehicleInfo()}
          onSuccess={handlePhaseComplete}
          onCancel={onClose}
        />
      );

    case 'mission-end':
      return (
        <KilometrageMissionEnd
          missionId={missionId}
          missionTitle={mission.title || 'Mission sans titre'}
          kmDepotStart={mission.kmDepotStart!}
          kmMissionStart={mission.kmMissionStart}
          vehicleInfo={getVehicleInfo()}
          onSuccess={handlePhaseComplete}
          onCancel={onClose}
        />
      );

    case 'completed':
      return (
        <View style={[styles.completedContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.completedTitle, { color: colors.success }]}>
            ✅ Mission Terminée
          </Text>
          <Text style={[styles.completedText, { color: colors.textSecondary }]}>
            Tous les kilométrages ont été enregistrés avec succès.
          </Text>
          
          <View style={[styles.summary, { backgroundColor: colors.background }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              📊 Résumé Final
            </Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Départ dépôt:
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {mission.kmDepotStart?.toLocaleString()} km
              </Text>
            </View>
            {mission.kmMissionStart && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Début mission:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {mission.kmMissionStart.toLocaleString()} km
                </Text>
              </View>
            )}
            {mission.kmMissionEnd && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Fin mission:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {mission.kmMissionEnd.toLocaleString()} km
                </Text>
              </View>
            )}
            {mission.kmDepotEnd && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Retour dépôt:
                </Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {mission.kmDepotEnd.toLocaleString()} km
                </Text>
              </View>
            )}
            
            {mission.kmDepotStart && mission.kmDepotEnd && (
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '600' }]}>
                  Distance totale:
                </Text>
                <Text style={[styles.summaryValue, styles.totalValue, { color: colors.primary }]}>
                  {(mission.kmDepotEnd - mission.kmDepotStart).toLocaleString()} km
                </Text>
              </View>
            )}
          </View>
        </View>
      );

    default:
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            État de mission inconnu
          </Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  completedContainer: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  summary: {
    borderRadius: 8,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
