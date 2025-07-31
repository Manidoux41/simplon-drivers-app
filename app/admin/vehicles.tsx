import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useVehicles } from '../../hooks/useVehicles';
import { Vehicle } from '../../lib/database';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';

export default function VehiclesManagement() {
  const router = useRouter();
  const { vehicles, loading, error, createVehicle, updateVehicleMileage, updateVehicleStatus } = useVehicles();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const handleCreateVehicle = async () => {
    if (!formData.brand || !formData.model || !formData.licensePlate || 
        !formData.fleetNumber || !formData.vin || !formData.firstRegistration ||
        !formData.enginePower || !formData.seats) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const vehicleData = {
      brand: formData.brand,
      model: formData.model,
      licensePlate: formData.licensePlate.toUpperCase(),
      fleetNumber: formData.fleetNumber.toUpperCase(),
      mileage: parseInt(formData.mileage) || 0,
      registrationDocument: {
        vin: formData.vin.toUpperCase(),
        firstRegistration: formData.firstRegistration,
        enginePower: parseInt(formData.enginePower),
        fuelType: formData.fuelType,
        seats: parseInt(formData.seats),
        category: formData.category,
      }
    };

    const success = await createVehicle(vehicleData);
    if (success) {
      Alert.alert('Succès', 'Véhicule créé avec succès');
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
      setShowCreateForm(false);
    }
  };

  const handleToggleStatus = (vehicle: Vehicle) => {
    const newStatus = !vehicle.isActive;
    Alert.alert(
      'Changer le statut',
      `Voulez-vous ${newStatus ? 'activer' : 'désactiver'} le véhicule ${vehicle.fleetNumber} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => updateVehicleStatus(vehicle.id, newStatus)
        }
      ]
    );
  };

  const handleUpdateMileage = (vehicle: Vehicle) => {
    Alert.prompt(
      'Mettre à jour le kilométrage',
      `Kilométrage actuel: ${vehicle.mileage.toLocaleString()} km\nNouveau kilométrage:`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Mettre à jour',
          onPress: (text) => {
            const newMileage = parseInt(text || '0');
            if (newMileage > vehicle.mileage) {
              updateVehicleMileage(vehicle.id, newMileage);
            } else {
              Alert.alert('Erreur', 'Le nouveau kilométrage doit être supérieur à l\'actuel');
            }
          }
        }
      ],
      'plain-text',
      vehicle.mileage.toString()
    );
  };

  const getFuelTypeColor = (fuelType: string) => {
    switch (fuelType) {
      case 'DIESEL': return '#6B7280';
      case 'ESSENCE': return '#EF4444';
      case 'ELECTRIQUE': return '#10B981';
      case 'HYBRIDE': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec logo */}
      <Header 
        title="Gestion de la Flotte" 
        showLogo={true}
        style={styles.headerStyle}
      />
      
      {/* Bouton de retour et d'ajout */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        
        <View style={styles.rightButtons}>
          <TouchableOpacity 
            onPress={() => router.push('/admin/map-test' as any)}
            style={styles.testButton}
          >
            <Ionicons name="map" size={20} color={Colors.light.primary} />
            <Text style={[styles.testText, { color: Colors.light.primary }]}>Test Cartes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowCreateForm(!showCreateForm)}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={Colors.light.primary} />
            <Text style={[styles.addText, { color: Colors.light.primary }]}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Formulaire de création */}
        {showCreateForm && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Ajouter un nouveau véhicule</Text>
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Marque *"
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Modèle *"
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
              />
            </View>
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Immatriculation * (ex: AB-123-CD)"
                value={formData.licensePlate}
                onChangeText={(text) => setFormData({ ...formData, licensePlate: text })}
                autoCapitalize="characters"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="N° Parc * (ex: CS001)"
                value={formData.fleetNumber}
                onChangeText={(text) => setFormData({ ...formData, fleetNumber: text })}
                autoCapitalize="characters"
              />
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Kilométrage initial"
              value={formData.mileage}
              onChangeText={(text) => setFormData({ ...formData, mileage: text })}
              keyboardType="numeric"
            />

            <Text style={styles.sectionTitle}>Informations carte grise</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Numéro de châssis (VIN) *"
              value={formData.vin}
              onChangeText={(text) => setFormData({ ...formData, vin: text })}
              autoCapitalize="characters"
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Date 1ère immat. * (AAAA-MM-JJ)"
                value={formData.firstRegistration}
                onChangeText={(text) => setFormData({ ...formData, firstRegistration: text })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Puissance (CV) *"
                value={formData.enginePower}
                onChangeText={(text) => setFormData({ ...formData, enginePower: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Nombre de places *"
                value={formData.seats}
                onChangeText={(text) => setFormData({ ...formData, seats: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Catégorie (ex: M3)"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />
            </View>

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

            <View style={styles.formButtons}>
              <Button
                title="Annuler"
                onPress={() => setShowCreateForm(false)}
                variant="ghost"
                style={styles.cancelButton}
              />
              <Button
                title="Créer"
                onPress={handleCreateVehicle}
                style={styles.createButton}
              />
            </View>
          </View>
        )}

        {/* Liste des véhicules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Flotte ({vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''})
          </Text>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleItem}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>
                  {vehicle.fleetNumber} - {vehicle.brand} {vehicle.model}
                </Text>
                <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
                <Text style={styles.vehicleDetails}>
                  {vehicle.mileage.toLocaleString()} km • {vehicle.registrationDocument.seats} places
                </Text>
                <Text style={styles.vehicleVin}>
                  VIN: {vehicle.registrationDocument.vin}
                </Text>
                
                <View style={styles.vehicleBadges}>
                  <View style={[styles.badge, { backgroundColor: getFuelTypeColor(vehicle.registrationDocument.fuelType) }]}>
                    <Text style={styles.badgeText}>{vehicle.registrationDocument.fuelType}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(vehicle.isActive) }]}>
                    <Text style={styles.badgeText}>
                      {vehicle.isActive ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: '#6366f1' }]}>
                    <Text style={styles.badgeText}>{vehicle.registrationDocument.category}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.vehicleActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleUpdateMileage(vehicle)}
                >
                  <Ionicons name="speedometer" size={20} color={Colors.light.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleToggleStatus(vehicle)}
                >
                  <Ionicons 
                    name={vehicle.isActive ? "pause" : "play"} 
                    size={20} 
                    color={vehicle.isActive ? "#f59e0b" : "#10b981"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  createForm: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 12,
    color: Colors.light.text,
  },
  fuelLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  fuelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fuelButton: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
    alignItems: 'center',
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
    color: 'white',
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  vehicleItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vehicleVin: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  vehicleBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  testText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
});
