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
import { KilometrageService } from '../services/KilometrageService';

interface KilometrageInputProps {
  missionId: string;
  missionTitle: string;
  currentKmDepotStart?: number;
  currentKmMissionStart?: number;
  currentKmMissionEnd?: number;
  currentKmDepotEnd?: number;
  phase: 'start' | 'end';
  onSuccess: () => void;
  onCancel: () => void;
}

export function KilometrageInput({
  missionId,
  missionTitle,
  currentKmDepotStart,
  currentKmMissionStart,
  currentKmMissionEnd,
  currentKmDepotEnd,
  phase,
  onSuccess,
  onCancel
}: KilometrageInputProps) {
  const [kmDepotStart, setKmDepotStart] = useState(currentKmDepotStart?.toString() || '');
  const [kmMissionStart, setKmMissionStart] = useState(currentKmMissionStart?.toString() || '');
  const [kmMissionEnd, setKmMissionEnd] = useState(currentKmMissionEnd?.toString() || '');
  const [kmDepotEnd, setKmDepotEnd] = useState(currentKmDepotEnd?.toString() || '');
  const [loading, setLoading] = useState(false);
  const colors = Colors.light;

  const isStartPhase = phase === 'start';
  const title = isStartPhase ? 'Kilométrage de Départ' : 'Kilométrage de Fin';

  const handleSave = async () => {
    try {
      setLoading(true);

      if (isStartPhase) {
        // Phase de départ : saisie dépôt + début mission
        const kmDepot = parseFloat(kmDepotStart);
        const kmMission = parseFloat(kmMissionStart);

        if (isNaN(kmDepot) || isNaN(kmMission)) {
          Alert.alert('Erreur', 'Veuillez saisir des valeurs numériques valides');
          return;
        }

        await KilometrageService.updateStartKilometrage(missionId, kmDepot, kmMission);
        
        Alert.alert(
          'Kilométrage enregistré',
          `Départ dépôt: ${kmDepot} km\nDébut mission: ${kmMission} km`,
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        // Phase de fin : saisie fin mission + retour dépôt
        const kmMission = parseFloat(kmMissionEnd);
        const kmDepot = parseFloat(kmDepotEnd);

        if (isNaN(kmMission) || isNaN(kmDepot)) {
          Alert.alert('Erreur', 'Veuillez saisir des valeurs numériques valides');
          return;
        }

        await KilometrageService.updateEndKilometrage(missionId, kmMission, kmDepot);
        
        Alert.alert(
          'Mission terminée',
          `Fin mission: ${kmMission} km\nRetour dépôt: ${kmDepot} km`,
          [{ text: 'OK', onPress: onSuccess }]
        );
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer le kilométrage');
    } finally {
      setLoading(false);
    }
  };

  const validateInput = () => {
    if (isStartPhase) {
      const kmDepot = parseFloat(kmDepotStart);
      const kmMission = parseFloat(kmMissionStart);
      
      if (isNaN(kmDepot) || isNaN(kmMission)) return false;
      if (kmMission < kmDepot) return false;
      
      return true;
    } else {
      const kmMission = parseFloat(kmMissionEnd);
      const kmDepot = parseFloat(kmDepotEnd);
      
      if (isNaN(kmMission) || isNaN(kmDepot)) return false;
      if (kmDepot < kmMission) return false;
      if (currentKmMissionStart && kmMission < currentKmMissionStart) return false;
      
      return true;
    }
  };

  const isValidInput = validateInput();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.missionTitle, { color: colors.textSecondary }]}>
        {missionTitle}
      </Text>

      {isStartPhase ? (
        // Phase de départ
        <>
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="business" size={20} color={colors.primary} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Kilométrage départ dépôt
              </Text>
            </View>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.background, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={kmDepotStart}
              onChangeText={setKmDepotStart}
              placeholder="Ex: 125000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="location" size={20} color={colors.success} />
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
              placeholder="Ex: 125025"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          {kmDepotStart && kmMissionStart && (
            <View style={[styles.preview, { backgroundColor: colors.background }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                Distance dépôt → mission
              </Text>
              <Text style={[styles.previewValue, { color: colors.success }]}>
                {Math.max(0, parseFloat(kmMissionStart) - parseFloat(kmDepotStart))} km
              </Text>
            </View>
          )}
        </>
      ) : (
        // Phase de fin
        <>
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <Ionicons name="flag" size={20} color={colors.error} />
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Kilométrage fin mission
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
              placeholder="Ex: 125090"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              returnKeyType="next"
            />
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

          {kmMissionEnd && kmDepotEnd && currentKmMissionStart && (
            <View style={[styles.preview, { backgroundColor: colors.background }]}>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  Distance mission
                </Text>
                <Text style={[styles.previewValue, { color: colors.success }]}>
                  {Math.max(0, parseFloat(kmMissionEnd) - currentKmMissionStart)} km
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                  Distance mission → dépôt
                </Text>
                <Text style={[styles.previewValue, { color: colors.info }]}>
                  {Math.max(0, parseFloat(kmDepotEnd) - parseFloat(kmMissionEnd))} km
                </Text>
              </View>
            </View>
          )}
        </>
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
            styles.saveButton, 
            { backgroundColor: isValidInput ? colors.primary : colors.border }
          ]}
          onPress={handleSave}
          disabled={!isValidInput || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.textOnPrimary }]}>
              {isStartPhase ? 'Commencer' : 'Terminer'}
            </Text>
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  missionTitle: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
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
  preview: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  },
});
