import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Vehicle } from '../lib/database';
import { Button } from './ui/Button';

interface VehicleFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (vehicleData: any) => Promise<boolean>;
  vehicle?: Vehicle | null; // null pour création, Vehicle pour modification
  title: string;
}

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  vehicle,
  title,
}) => {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    licensePlate: '',
    fleetNumber: '',
    mileage: '',
    vin: '',
    firstRegistration: '',
    enginePower: '',
    fuelType: 'DIESEL' as 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE',
    seats: '',
    category: 'M3',
  });

  const [loading, setLoading] = useState(false);

  // Initialiser le formulaire avec les données du véhicule en mode édition
  useEffect(() => {
    if (vehicle) {
      setFormData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        licensePlate: vehicle.licensePlate || '',
        fleetNumber: vehicle.fleetNumber || '',
        mileage: vehicle.mileage?.toString() || '',
        vin: vehicle.registrationDocument?.vin || '',
        firstRegistration: vehicle.registrationDocument?.firstRegistration || '',
        enginePower: vehicle.registrationDocument?.enginePower?.toString() || '',
        fuelType: vehicle.registrationDocument?.fuelType || 'DIESEL',
        seats: vehicle.registrationDocument?.seats?.toString() || '',
        category: vehicle.registrationDocument?.category || 'M3',
      });
    } else {
      // Réinitialiser pour une création
      setFormData({
        brand: '',
        model: '',
        licensePlate: '',
        fleetNumber: '',
        mileage: '',
        vin: '',
        firstRegistration: '',
        enginePower: '',
        fuelType: 'DIESEL',
        seats: '',
        category: 'M3',
      });
    }
  }, [vehicle, visible]);

  const handleSubmit = async () => {
    // Validation des champs obligatoires
    const requiredFields = ['brand', 'model', 'licensePlate', 'fleetNumber', 'vin', 'firstRegistration', 'enginePower', 'seats'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      let vehicleData;

      if (vehicle) {
        // Mode édition - ne passer que les champs modifiés
        vehicleData = {
          brand: formData.brand,
          model: formData.model,
          licensePlate: formData.licensePlate,
          fleetNumber: formData.fleetNumber,
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          registrationDocument: {
            vin: formData.vin,
            firstRegistration: formData.firstRegistration,
            enginePower: parseInt(formData.enginePower),
            fuelType: formData.fuelType,
            seats: parseInt(formData.seats),
            category: formData.category,
          },
        };
      } else {
        // Mode création - format attendu par createVehicle
        vehicleData = {
          brand: formData.brand,
          model: formData.model,
          licensePlate: formData.licensePlate,
          fleetNumber: formData.fleetNumber,
          mileage: formData.mileage ? parseInt(formData.mileage) : 0,
          registrationDocument: {
            vin: formData.vin,
            firstRegistration: formData.firstRegistration,
            enginePower: parseInt(formData.enginePower),
            fuelType: formData.fuelType,
            seats: parseInt(formData.seats),
            category: formData.category,
          },
        };
      }

      const success = await onSubmit(vehicleData);
      if (success) {
        Alert.alert(
          'Succès',
          vehicle ? 'Véhicule modifié avec succès' : 'Véhicule créé avec succès',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Informations générales */}
            <Text style={styles.sectionTitle}>Informations générales</Text>
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Marque *"
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                editable={!loading}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Modèle *"
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Plaque d'immatriculation *"
                value={formData.licensePlate}
                onChangeText={(text) => setFormData({ ...formData, licensePlate: text.toUpperCase() })}
                editable={!loading}
                autoCapitalize="characters"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Numéro de flotte *"
                value={formData.fleetNumber}
                onChangeText={(text) => setFormData({ ...formData, fleetNumber: text.toUpperCase() })}
                editable={!loading}
                autoCapitalize="characters"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Kilométrage"
              value={formData.mileage}
              onChangeText={(text) => setFormData({ ...formData, mileage: text })}
              keyboardType="numeric"
              editable={!loading}
            />

            {/* Document d'immatriculation */}
            <Text style={styles.sectionTitle}>Document d'immatriculation</Text>

            <TextInput
              style={styles.input}
              placeholder="Numéro VIN *"
              value={formData.vin}
              onChangeText={(text) => setFormData({ ...formData, vin: text.toUpperCase() })}
              editable={!loading}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="Date première immatriculation (YYYY-MM-DD) *"
              value={formData.firstRegistration}
              onChangeText={(text) => setFormData({ ...formData, firstRegistration: text })}
              editable={!loading}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Puissance moteur (CV) *"
                value={formData.enginePower}
                onChangeText={(text) => setFormData({ ...formData, enginePower: text })}
                keyboardType="numeric"
                editable={!loading}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Nombre de places *"
                value={formData.seats}
                onChangeText={(text) => setFormData({ ...formData, seats: text })}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Catégorie (ex: M3)"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
              editable={!loading}
            />

            {/* Sélection du carburant */}
            <Text style={styles.fuelLabel}>Type de carburant :</Text>
            <View style={styles.fuelSelector}>
              {(['DIESEL', 'ESSENCE', 'ELECTRIQUE', 'HYBRIDE'] as const).map((fuel) => (
                <TouchableOpacity
                  key={fuel}
                  style={[
                    styles.fuelButton,
                    formData.fuelType === fuel && styles.fuelButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, fuelType: fuel })}
                  disabled={loading}
                >
                  <Text style={[
                    styles.fuelButtonText,
                    formData.fuelType === fuel && styles.fuelButtonTextActive
                  ]}>
                    {fuel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.formButtons}>
            <Button
              title="Annuler"
              onPress={handleClose}
              variant="ghost"
              style={styles.cancelButton}
              disabled={loading}
            />
            <Button
              title={loading ? 'En cours...' : (vehicle ? 'Modifier' : 'Créer')}
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  fuelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 4,
  },
  fuelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fuelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  fuelButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  fuelButtonText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  fuelButtonTextActive: {
    color: Colors.light.textOnPrimary,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default VehicleFormModal;