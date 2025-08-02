import React, { useState, useEffect } from 'react';
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

interface KilometrageDepotStartProps {
  missionId: string;
  missionTitle: string;
  vehicleInfo?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function KilometrageDepotStart({
  missionId,
  missionTitle,
  vehicleInfo,
  onSuccess,
  onCancel
}: KilometrageDepotStartProps) {
  const [kmDepotStart, setKmDepotStart] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingVehicleKm, setLoadingVehicleKm] = useState(true);
  const colors = Colors.light;

  useEffect(() => {
    loadCurrentVehicleMileage();
  }, [missionId]);

  const loadCurrentVehicleMileage = async () => {
    try {
      setLoadingVehicleKm(true);
      const currentMileage = await KilometrageServiceV2.getCurrentVehicleMileage(missionId);
      if (currentMileage !== null) {
        setKmDepotStart(currentMileage.toString());
      }
    } catch (error) {
      console.warn('Impossible de récupérer le kilométrage actuel du véhicule');
    } finally {
      setLoadingVehicleKm(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const kmDepot = parseFloat(kmDepotStart);
      if (isNaN(kmDepot) || kmDepot < 0) {
        Alert.alert('Erreur', 'Veuillez saisir un kilométrage valide');
        return;
      }

      await KilometrageServiceV2.startMissionWithDepotKm(missionId, kmDepot);
      
      Alert.alert(
        'Mission démarrée !',
        `Kilométrage de départ: ${kmDepot.toLocaleString()} km\n\nVous pouvez maintenant vous rendre sur le lieu de prise en charge.`,
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de démarrer la mission');
    } finally {
      setLoading(false);
    }
  };

  const isValidInput = () => {
    const km = parseFloat(kmDepotStart);
    return !isNaN(km) && km >= 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="play-circle" size={24} color={colors.success} />
          <Text style={[styles.title, { color: colors.text }]}>
            Démarrer la Mission
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

      <View style={styles.description}>
        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
          📍 <Text style={{ fontWeight: '600' }}>Étape 1:</Text> Relevez le kilométrage de votre véhicule avant de quitter le dépôt.
        </Text>
        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
          ⚡ La mission passera automatiquement en statut "En cours" après validation.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputHeader}>
          <Ionicons name="business" size={20} color={colors.primary} />
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Kilométrage départ dépôt
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.background, 
              borderColor: colors.border,
              color: colors.text 
            }]}
            value={kmDepotStart}
            onChangeText={setKmDepotStart}
            placeholder={loadingVehicleKm ? "Chargement..." : "Ex: 125000"}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            returnKeyType="done"
            autoFocus={!loadingVehicleKm}
            editable={!loadingVehicleKm}
          />
          {loadingVehicleKm && (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>
        {!loadingVehicleKm && kmDepotStart && (
          <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
            💡 Kilométrage pré-rempli depuis le véhicule de la flotte
          </Text>
        )}
      </View>

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
            styles.startButton, 
            { backgroundColor: isValidInput() ? colors.success : colors.border }
          ]}
          onPress={handleSave}
          disabled={!isValidInput() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textOnPrimary} />
          ) : (
            <>
              <Ionicons name="play" size={16} color={colors.textOnPrimary} />
              <Text style={[styles.startButtonText, { color: colors.textOnPrimary }]}>
                Démarrer Mission
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
    marginBottom: 16,
  },
  vehicleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  description: {
    marginBottom: 20,
    gap: 8,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
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
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
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
  startButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});
