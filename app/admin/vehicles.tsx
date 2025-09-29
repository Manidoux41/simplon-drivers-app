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
import { VehicleFormModal } from '../../components/VehicleFormModal';

export default function VehiclesManagement() {
  const router = useRouter();
  const { vehicles, loading, error, createVehicle, updateVehicleMileage, updateVehicleStatus, updateVehicle, deleteVehicle } = useVehicles();
  
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Fonctions pour les modals
  const handleCreateVehicle = () => {
    setEditingVehicle(null);
    setShowModal(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowModal(true);
  };

  const handleSubmitVehicle = async (vehicleData: any) => {
    try {
      if (editingVehicle) {
        // Mode édition
        return await updateVehicle(editingVehicle.id, vehicleData);
      } else {
        // Mode création
        return await createVehicle(vehicleData);
      }
    } catch (error) {
      return false;
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    Alert.alert(
      'Supprimer le véhicule',
      `Êtes-vous sûr de vouloir supprimer le véhicule ${vehicle.fleetNumber} (${vehicle.licensePlate}) ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteVehicle(vehicle.id);
            if (success) {
              Alert.alert('Succès', 'Véhicule supprimé avec succès');
            }
          }
        }
      ]
    );
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
            onPress={() => router.push('/admin/test-geocoding' as any)}
            style={styles.testButton}
          >
            <Ionicons name="location" size={20} color="#8b5cf6" />
            <Text style={[styles.testText, { color: '#8b5cf6' }]}>Test Géocodage</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/admin/map-test' as any)}
            style={styles.testButton}
          >
            <Ionicons name="map" size={20} color={Colors.light.primary} />
            <Text style={[styles.testText, { color: Colors.light.primary }]}>Test Cartes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleCreateVehicle}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addText}>Ajouter véhicule</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
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

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditVehicle(vehicle)}
                >
                  <Ionicons name="create" size={20} color="#3b82f6" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteVehicle(vehicle)}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bouton flottant pour ajouter un véhicule */}
      <TouchableOpacity 
        onPress={handleCreateVehicle}
        style={styles.floatingButton}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal pour créer/modifier un véhicule */}
      <VehicleFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitVehicle}
        vehicle={editingVehicle}
        title={editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
      />
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
    padding: 12,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
