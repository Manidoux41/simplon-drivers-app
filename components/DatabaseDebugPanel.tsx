import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { forceDatabaseMigrations, resetDatabase, databaseService } from '../lib/database';

export function DatabaseDebugPanel() {
  const colors = Colors.light;

  const handleForceMigrations = async () => {
    try {
      console.log('🔄 Démarrage des migrations forcées...');
      await forceDatabaseMigrations();
      Alert.alert('Succès', 'Migrations de la base de données appliquées avec succès !\n\nVérifiez les logs pour les détails.');
    } catch (error: any) {
      console.error('❌ Erreur migrations:', error);
      Alert.alert('Erreur', `Erreur lors des migrations: ${error.message}`);
    }
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Réinitialiser la base de données',
      '⚠️ Cette action va supprimer toutes les données et recréer les tables.\n\nVoulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Réinitialisation de la base de données...');
              await resetDatabase();
              Alert.alert('Succès', 'Base de données réinitialisée avec succès !');
            } catch (error: any) {
              console.error('❌ Erreur réinitialisation:', error);
              Alert.alert('Erreur', `Erreur lors de la réinitialisation: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleAddSampleVehicles = async () => {
    try {
      console.log('🚗 Ajout de véhicules d\'exemple...');
      
      const sampleVehicles = [
        {
          brand: 'Mercedes',
          model: 'Sprinter',
          licensePlate: 'AB-123-CD',
          fleetNumber: 'BUS001',
          mileage: 15000,
          registrationDocument: {
            vin: 'WDB9066351234567',
            firstRegistration: '2020-03-15',
            enginePower: 163,
            fuelType: 'DIESEL' as const,
            seats: 18,
            category: 'M3'
          }
        },
        {
          brand: 'Volvo',
          model: '9700',
          licensePlate: 'EF-456-GH',
          fleetNumber: 'BUS002',
          mileage: 22000,
          registrationDocument: {
            vin: 'YV3R8H40XKA123456',
            firstRegistration: '2019-08-20',
            enginePower: 420,
            fuelType: 'DIESEL' as const,
            seats: 53,
            category: 'M3'
          }
        },
        {
          brand: 'Iveco',
          model: 'Daily',
          licensePlate: 'IJ-789-KL',
          fleetNumber: 'VAN001',
          mileage: 8500,
          registrationDocument: {
            vin: 'ZCFC35A500V123456',
            firstRegistration: '2021-01-10',
            enginePower: 136,
            fuelType: 'DIESEL' as const,
            seats: 9,
            category: 'M2'
          }
        }
      ];

      for (const vehicle of sampleVehicles) {
        await databaseService.createVehicle(vehicle);
      }

      Alert.alert('Succès', `${sampleVehicles.length} véhicules d'exemple ajoutés avec succès !`);
    } catch (error: any) {
      console.error('❌ Erreur ajout véhicules:', error);
      Alert.alert('Erreur', `Erreur lors de l'ajout des véhicules: ${error.message}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        🛠️ Debug Base de Données
      </Text>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleForceMigrations}
      >
        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
          🔄 Forcer les migrations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.success || '#22c55e' }]}
        onPress={handleAddSampleVehicles}
      >
        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
          🚗 Ajouter véhicules d'exemple
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.dangerButton, { backgroundColor: colors.error }]}
        onPress={handleResetDatabase}
      >
        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
          🗑️ Réinitialiser la DB
        </Text>
      </TouchableOpacity>

      <Text style={[styles.info, { color: colors.textSecondary }]}>
        💡 Utilisez "Forcer les migrations" pour ajouter les colonnes kilométriques à la base de données existante.
        {'\n'}🚗 Ajoutez des véhicules d'exemple pour tester la création de missions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  dangerButton: {
    // backgroundColor sera défini via le style inline
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
