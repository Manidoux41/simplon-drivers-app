import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { PdfService, MissionPdfData } from '../services/PdfService';

interface MissionPdfActionsProps {
  missionData: MissionPdfData;
  style?: any;
  showLabels?: boolean;
  iconSize?: number;
}

export function MissionPdfActions({
  missionData,
  style,
  showLabels = true,
  iconSize = 20
}: MissionPdfActionsProps) {
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<'print' | 'share' | null>(null);
  const colors = Colors.light;

  const handlePrintDirect = async () => {
    try {
      setLoading(true);
      setCurrentAction('print');
      
      await PdfService.printMissionDirect(missionData);
      
      Alert.alert(
        'Impression lancée',
        'La mission a été envoyée vers l\'imprimante sélectionnée.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Erreur impression:', error);
      Alert.alert(
        'Erreur d\'impression',
        error.message || 'Impossible d\'imprimer la mission. Vérifiez votre connexion à l\'imprimante.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  };

  const handleSharePdf = async () => {
    try {
      setLoading(true);
      setCurrentAction('share');
      
      await PdfService.shareMissionPdf(missionData);
    } catch (error: any) {
      console.error('Erreur partage PDF:', error);
      Alert.alert(
        'Erreur de partage',
        error.message || 'Impossible de partager le PDF de la mission.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  };

  const handleGenerateAndDownload = async () => {
    try {
      setLoading(true);
      setCurrentAction('share');
      
      const pdfUri = await PdfService.generateMissionPdf(missionData);
      
      Alert.alert(
        'PDF généré',
        `Le PDF de la mission "${missionData.mission.title}" a été créé avec succès.`,
        [
          { text: 'OK' },
          {
            text: 'Partager',
            onPress: () => handleSharePdf()
          }
        ]
      );
      
      console.log('PDF généré:', pdfUri);
    } catch (error: any) {
      console.error('Erreur génération PDF:', error);
      Alert.alert(
        'Erreur de génération',
        error.message || 'Impossible de générer le PDF de la mission.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  };

  const isActionLoading = (action: 'print' | 'share') => {
    return loading && currentAction === action;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Bouton Impression directe */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.primary },
          isActionLoading('print') && styles.buttonLoading
        ]}
        onPress={handlePrintDirect}
        disabled={loading}
      >
        {isActionLoading('print') ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Ionicons name="print" size={iconSize} color={colors.textOnPrimary} />
        )}
        {showLabels && (
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            {isActionLoading('print') ? 'Impression...' : 'Imprimer'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Bouton Partager PDF */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.success },
          isActionLoading('share') && styles.buttonLoading
        ]}
        onPress={handleSharePdf}
        disabled={loading}
      >
        {isActionLoading('share') ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Ionicons name="share" size={iconSize} color={colors.textOnPrimary} />
        )}
        {showLabels && (
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            {isActionLoading('share') ? 'Génération...' : 'Partager PDF'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Bouton Générer PDF seulement */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.info },
          loading && styles.buttonLoading
        ]}
        onPress={handleGenerateAndDownload}
        disabled={loading}
      >
        {loading && currentAction === null ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Ionicons name="document" size={iconSize} color={colors.textOnPrimary} />
        )}
        {showLabels && (
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            {loading && currentAction === null ? 'Génération...' : 'Générer PDF'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    flex: 1,
    marginHorizontal: 4,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Hook personnalisé pour utiliser les actions PDF dans d'autres composants
export function useMissionPdfActions(missionData: MissionPdfData) {
  const [loading, setLoading] = useState(false);

  const printMission = async () => {
    try {
      setLoading(true);
      await PdfService.printMissionDirect(missionData);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur impression:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const shareMissionPdf = async () => {
    try {
      setLoading(true);
      await PdfService.shareMissionPdf(missionData);
      return { success: true };
    } catch (error: any) {
      console.error('Erreur partage:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const generateMissionPdf = async () => {
    try {
      setLoading(true);
      const uri = await PdfService.generateMissionPdf(missionData);
      return { success: true, uri };
    } catch (error: any) {
      console.error('Erreur génération:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    printMission,
    shareMissionPdf,
    generateMissionPdf,
  };
}
