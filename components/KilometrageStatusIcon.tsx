import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Mission } from '../lib/database';

interface KilometrageStatusIconProps {
  mission: Mission;
  size?: number;
}

export function KilometrageStatusIcon({ mission, size = 16 }: KilometrageStatusIconProps) {
  const colors = Colors.light;

  const hasStartData = mission.kmDepotStart !== undefined && mission.kmMissionStart !== undefined;
  const hasEndData = mission.kmMissionEnd !== undefined && mission.kmDepotEnd !== undefined;
  const isComplete = hasStartData && hasEndData;

  const getIconConfig = () => {
    if (isComplete) {
      return {
        name: 'checkmark-circle' as const,
        color: colors.success,
        backgroundColor: colors.success + '20',
      };
    } else if (hasStartData) {
      return {
        name: 'hourglass' as const,
        color: colors.warning,
        backgroundColor: colors.warning + '20',
      };
    } else {
      return {
        name: 'speedometer-outline' as const,
        color: colors.textSecondary,
        backgroundColor: colors.textSecondary + '20',
      };
    }
  };

  const config = getIconConfig();

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: config.backgroundColor,
        width: size + 8,
        height: size + 8,
      }
    ]}>
      <Ionicons 
        name={config.name} 
        size={size} 
        color={config.color} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
