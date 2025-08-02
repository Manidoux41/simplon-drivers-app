import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View, 
  Modal,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Mission } from '../lib/database';
import { KilometrageInput } from './KilometrageInput';

interface KilometrageButtonProps {
  mission: Mission;
  onUpdate: (missionId: string) => void;
  style?: any;
}

export function KilometrageButton({ mission, onUpdate, style }: KilometrageButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const colors = Colors.light;

  const hasStartData = mission.kmDepotStart !== undefined && mission.kmMissionStart !== undefined;
  const hasEndData = mission.kmMissionEnd !== undefined && mission.kmDepotEnd !== undefined;
  const isComplete = hasStartData && hasEndData;

  const getButtonConfig = () => {
    if (isComplete) {
      return {
        text: 'Kilométrage complet',
        icon: 'checkmark-circle' as const,
        color: colors.success,
        disabled: true,
        phase: 'end' as const
      };
    } else if (hasStartData) {
      return {
        text: 'Terminer mission',
        icon: 'flag' as const,
        color: colors.error,
        disabled: false,
        phase: 'end' as const
      };
    } else {
      return {
        text: 'Commencer mission',
        icon: 'play' as const,
        color: colors.primary,
        disabled: false,
        phase: 'start' as const
      };
    }
  };

  const config = getButtonConfig();

  const handlePress = () => {
    if (config.disabled) {
      Alert.alert(
        'Kilométrage complet',
        'Le kilométrage de cette mission est déjà enregistré.',
        [
          {
            text: 'Modifier',
            onPress: () => setShowModal(true)
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    onUpdate(mission.id);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: config.color },
          config.disabled && styles.disabledButton,
          style
        ]}
        onPress={handlePress}
        disabled={config.disabled && !isComplete}
      >
        <Ionicons 
          name={config.icon} 
          size={20} 
          color={colors.textOnPrimary} 
        />
        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
          {config.text}
        </Text>
      </TouchableOpacity>

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
            phase={config.phase}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
