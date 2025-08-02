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

interface KilometrageMissionEndProps {
  missionId: string;
  missionTitle: string;
  kmDepotStart: number;
  kmMissionStart?: number;
  vehicleInfo?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function KilometrageMissionEnd({
  missionId,
  missionTitle,
  kmDepotStart,
  kmMissionStart,
  vehicleInfo,
  onSuccess,
  onCancel
}: KilometrageMissionEndProps) {
  const [kmMissionEnd, setKmMissionEnd] = useState(kmMissionStart?.toString() || kmDepotStart.toString());
  const [kmDepotEnd, setKmDepotEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const colors = Colors.light;

  const handleSave = async () => {
    try {
      setLoading(true);

      const kmEnd = parseFloat(kmMissionEnd);
      const kmDepot = parseFloat(kmDepotEnd);

      if (isNaN(kmEnd) || isNaN(kmDepot)) {
        Alert.alert('Erreur', 'Veuillez saisir des valeurs numériques valides');
        return;
      }

      await KilometrageServiceV2.completeMissionWithKm(missionId, kmEnd, kmDepot);
      
      const totalDistance = kmDepot - kmDepotStart;
      const missionDistance = kmEnd - (kmMissionStart || kmDepotStart);
      
      Alert.alert(
        'Mission terminée !',
        `✅ Mission accomplie avec succès\n\n📊 Résumé des distances:\n• Distance mission: ${missionDistance} km\n• Distance totale: ${totalDistance} km\n\nLe véhicule a été mis à jour avec le nouveau kilométrage.`,
        [{ text: 'Parfait !', onPress: onSuccess }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de terminer la mission');
    } finally {
      setLoading(false);
    }
  };

  const isValidInput = () => {
    const kmEnd = parseFloat(kmMissionEnd);
    const kmDepot = parseFloat(kmDepotEnd);
    
    if (isNaN(kmEnd) || isNaN(kmDepot)) return false;
    if (kmEnd < kmDepotStart) return false;
    if (kmDepot < kmEnd) return false;
    if (kmMissionStart && kmEnd < kmMissionStart) return false;
    
    return true;
  };

  const getPreviewDistances = () => {
    const kmEnd = parseFloat(kmMissionEnd);
    const kmDepot = parseFloat(kmDepotEnd);
    
    if (isNaN(kmEnd) || isNaN(kmDepot)) return null;
    
    return {
      missionDistance: Math.max(0, kmEnd - (kmMissionStart || kmDepotStart)),
      returnDistance: Math.max(0, kmDepot - kmEnd),
      totalDistance: Math.max(0, kmDepot - kmDepotStart)
    };
  };

  const previewDistances = getPreviewDistances();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="flag" size={24} color={colors.success} />
          <Text style={[styles.title, { color: colors.text }]}>
            Terminer la Mission
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
        {kmMissionStart && (
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
              Début mission:
            </Text>
            <Text style={[styles.statusValue, { color: colors.text }]}>
              {kmMissionStart.toLocaleString()} km
            </Text>
          </View>
        )}
      </View>

      <View style={styles.description}>
        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
          🏁 <Text style={{ fontWeight: '600' }}>Étape 3:</Text> Mission accomplie ! Relevez le kilométrage à destination puis au retour au dépôt.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputHeader}>
          <Ionicons name="flag" size={20} color={colors.success} />
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Kilométrage fin mission (destination)
          </Text>
        </View>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.background, 
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={kmMissionEnd}
          onChangeText={setKmMissionEnd}
          placeholder={`Minimum: ${(kmMissionStart || kmDepotStart).toLocaleString()}`}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          returnKeyType="next"
        />
        <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
          💡 Pré-rempli avec le kilométrage de {kmMissionStart ? 'début mission' : 'départ dépôt'}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputHeader}>
          <Ionicons name="business" size={20} color={colors.primary} />
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Kilométrage retour dépôt
          </Text>
        </View>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.background, 
            borderColor: colors.border,
            color: colors.text 
          }]}
          value={kmDepotEnd}
          onChangeText={setKmDepotEnd}
          placeholder="Ex: 125115"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          returnKeyType="done"
        />
      </View>

      {previewDistances && (
        <View style={[styles.preview, { backgroundColor: colors.background }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            📊 Aperçu des distances
          </Text>
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              Distance mission
            </Text>
            <Text style={[styles.previewValue, { color: colors.success }]}>
              {previewDistances.missionDistance} km
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              Distance retour
            </Text>
            <Text style={[styles.previewValue, { color: colors.info }]}>
              {previewDistances.returnDistance} km
            </Text>
          </View>
          <View style={[styles.previewRow, styles.totalRow]}>
            <Text style={[styles.previewLabel, { color: colors.text, fontWeight: '600' }]}>
              Distance totale
            </Text>
            <Text style={[styles.previewValue, styles.totalValue, { color: colors.primary }]}>
              {previewDistances.totalDistance} km
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
            Annuler
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.completeButton, 
            { backgroundColor: isValidInput() ? colors.success : colors.border }
          ]}
          onPress={handleSave}
          disabled={!isValidInput() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={16} color={colors.textOnPrimary} />
              <Text style={[styles.completeButtonText, { color: colors.textOnPrimary }]}>
                Terminer Mission
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
    gap: 4,
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
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  previewLabel: {
    fontSize: 12,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
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
  completeButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});
