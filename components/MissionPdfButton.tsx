import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { PdfService, MissionPdfData } from '../services/PdfService';

interface MissionPdfButtonProps {
  missionData: MissionPdfData;
  iconSize?: number;
  style?: any;
  variant?: 'print' | 'share';
}

export function MissionPdfButton({
  missionData,
  iconSize = 16,
  style,
  variant = 'share'
}: MissionPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const colors = Colors.light;

  const handleAction = async () => {
    try {
      setLoading(true);
      
      if (variant === 'print') {
        await PdfService.printMissionDirect(missionData);
        Alert.alert(
          'Impression lancée',
          'La mission a été envoyée vers l\'imprimante.',
          [{ text: 'OK' }]
        );
      } else {
        await PdfService.shareMissionPdf(missionData);
      }
    } catch (error: any) {
      console.error('Erreur action PDF:', error);
      Alert.alert(
        variant === 'print' ? 'Erreur d\'impression' : 'Erreur de partage',
        error.message || 'Une erreur est survenue.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const iconName = variant === 'print' ? 'print' : 'share';
  const backgroundColor = variant === 'print' ? colors.primary : colors.success;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        loading && styles.buttonLoading,
        style
      ]}
      onPress={handleAction}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.textOnPrimary} />
      ) : (
        <Ionicons name={iconName} size={iconSize} color={colors.textOnPrimary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonLoading: {
    opacity: 0.7,
  },
});
