import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Mission } from '../lib/database';
import { KilometrageInput } from './KilometrageInput';
import { KilometrageStatusIcon } from './KilometrageStatusIcon';

interface KilometrageActionsProps {
  mission: Mission;
  onUpdate: (missionId: string) => void;
  showSummary?: boolean;
}

export function KilometrageActions({ 
  mission, 
  onUpdate, 
  showSummary = true 
}: KilometrageActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'start' | 'end'>('start');
  const colors = Colors.light;

  const hasStartData = mission.kmDepotStart !== undefined && mission.kmMissionStart !== undefined;
  const hasEndData = mission.kmMissionEnd !== undefined && mission.kmDepotEnd !== undefined;
  const isComplete = hasStartData && hasEndData;

  const openModal = (phase: 'start' | 'end') => {
    setCurrentPhase(phase);
    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    onUpdate(mission.id);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const confirmReset = () => {
    Alert.alert(
      'Réinitialiser le kilométrage',
      'Êtes-vous sûr de vouloir supprimer toutes les données de kilométrage de cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            // TODO: Implement reset functionality
            Alert.alert('Fonctionnalité', 'Réinitialisation en cours de développement');
          }
        }
      ]
    );
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <KilometrageStatusIcon mission={mission} size={20} />
            <Text style={[styles.title, { color: colors.text }]}>
              Suivi kilométrique
            </Text>
          </View>
        </View>

        {showSummary && (
          <View style={styles.summary}>
            {hasStartData && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Distance dépôt → mission
                </Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {mission.kmMissionStart! - mission.kmDepotStart!} km
                </Text>
              </View>
            )}
            
            {hasEndData && mission.kmMissionStart && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Distance mission
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.info }]}>
                    {mission.distanceMissionOnly || (mission.kmMissionEnd! - mission.kmMissionStart)} km
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Distance totale
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {mission.distanceDepotToDepot || (mission.kmDepotEnd! - mission.kmDepotStart!)} km
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              hasStartData ? styles.completedButton : styles.primaryButton,
              { backgroundColor: hasStartData ? colors.success : colors.primary }
            ]}
            onPress={() => openModal('start')}
          >
            <Ionicons 
              name={hasStartData ? 'checkmark' : 'play'} 
              size={16} 
              color={colors.textOnPrimary} 
            />
            <Text style={[styles.actionText, { color: colors.textOnPrimary }]}>
              {hasStartData ? 'Départ OK' : 'Commencer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              !hasStartData && styles.disabledButton,
              hasEndData ? styles.completedButton : styles.secondaryButton,
              { 
                backgroundColor: hasEndData 
                  ? colors.success 
                  : hasStartData 
                    ? colors.error 
                    : colors.border 
              }
            ]}
            onPress={() => openModal('end')}
            disabled={!hasStartData}
          >
            <Ionicons 
              name={hasEndData ? 'checkmark' : 'flag'} 
              size={16} 
              color={hasStartData ? colors.textOnPrimary : colors.textSecondary} 
            />
            <Text style={[
              styles.actionText, 
              { color: hasStartData ? colors.textOnPrimary : colors.textSecondary }
            ]}>
              {hasEndData ? 'Fin OK' : 'Terminer'}
            </Text>
          </TouchableOpacity>

          {isComplete && (
            <TouchableOpacity
              style={[styles.resetButton, { borderColor: colors.error }]}
              onPress={confirmReset}
            >
              <Ionicons name="refresh" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <KilometrageInput
            missionId={mission.id}
            missionTitle={mission.title}
            currentKmDepotStart={mission.kmDepotStart}
            currentKmMissionStart={mission.kmMissionStart}
            currentKmMissionEnd={mission.kmMissionEnd}
            currentKmDepotEnd={mission.kmDepotEnd}
            phase={currentPhase}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summary: {
    marginBottom: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 40,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    // backgroundColor set dynamically
  },
  completedButton: {
    // backgroundColor set dynamically
  },
  disabledButton: {
    opacity: 0.5,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
