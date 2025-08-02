import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { KilometrageServiceV2 } from '../services/KilometrageServiceV2';

interface KilometrageMissionStartProps {
  missionId: string;
  missionTitle: string;
  kmDepotStart: number;
  vehicleInfo?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function KilometrageMissionStart({
  missionId,
  missionTitle,
  kmDepotStart,
  vehicleInfo,
  onSuccess,
  onCancel
}: KilometrageMissionStartProps) {
  const [kmMissionStart, setKmMissionStart] = useState(kmDepotStart.toString());
  const [loading, setLoading] = useState(false);
  const colors = Colors.light;

  const handleSave = async () => {
    try {
      setLoading(true);

      const kmMission = parseFloat(kmMissionStart);
      if (isNaN(kmMission) || kmMission < 0) {
        Alert.alert('Erreur', 'Veuillez saisir un kilométrage valide');
        return;
      }

      if (kmMission < kmDepotStart) {
        Alert.alert(
          'Erreur', 
          `Le kilométrage ne peut pas être inférieur au départ du dépôt (${kmDepotStart.toLocaleString()} km)`
        );
        return;
      }

      await KilometrageServiceV2.addMissionStartKm(missionId, kmMission);
      
      const distance = kmMission - kmDepotStart;
      Alert.alert(
        'Kilométrage enregistré !',
        `Début mission: ${kmMission.toLocaleString()} km\nDistance parcourue: ${distance} km\n\nVous pouvez maintenant effectuer votre mission.`,
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer le kilométrage');
    } finally {
      setLoading(false);
    }
  };

  const isValidInput = () => {
    const km = parseFloat(kmMissionStart);
    return !isNaN(km) && km >= kmDepotStart;
  };

  const getPreviewDistance = () => {
    const km = parseFloat(kmMissionStart);
    if (isNaN(km)) return 0;
    return Math.max(0, km - kmDepotStart);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="location" size={24} color={colors.info} />
          <Text style={[styles.title, { color: colors.text }]}>
            Arrivée sur Site
          </Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.missionTitle, { color: colors.textSecondary }]}>
        {missionTitle}
      </Text>

      {vehicleInfo && (
        <View style={[styles.vehicleInfo, { backgroundColor: colors.background }]}>
          <Ionicons name="car-sport" size={16} color={colors.primary} />
          <Text style={[styles.vehicleText, { color: colors.text }]}>
            {vehicleInfo}
          </Text>
        </View>
      )}

      <View style={[styles.statusInfo, { backgroundColor: colors.background }]}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Départ dépôt:
          </Text>
          <Text style={[styles.statusValue, { color: colors.text }]}>
            {kmDepotStart.toLocaleString()} km
          </Text>
        </View>
      </View>

      <View style={styles.description}>
        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
          📍 <Text style={{ fontWeight: '600' }}>Étape 2:</Text> Vous êtes arrivé sur le lieu de prise en charge. Relevez le kilométrage actuel.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputHeader}>
          <Ionicons name="location" size={20} color={colors.info} />
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Kilométrage début mission
          </Text>
        </View>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.background, 
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={kmMissionStart}
          onChangeText={setKmMissionStart}
          placeholder={`Minimum: ${kmDepotStart.toLocaleString()}`}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          returnKeyType="done"
          autoFocus
        />
        <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
          💡 Valeur pré-remplie avec le kilométrage du départ dépôt
        </Text>
      </View>

      {kmMissionStart && isValidInput() && (
        <View style={[styles.preview, { backgroundColor: colors.background }]}>
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              Distance dépôt → mission
            </Text>
            <Text style={[styles.previewValue, { color: colors.info }]}>
              {getPreviewDistance()} km
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
            Plus tard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.saveButton, 
            { backgroundColor: isValidInput() ? colors.info : colors.border }
          ]}
          onPress={handleSave}
          disabled={!isValidInput() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
              <Text style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>
                Enregistrer
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  missionTitle: {
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  preview: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 12,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});
