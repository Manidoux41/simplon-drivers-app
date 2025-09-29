import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { databaseService, User, Mission } from '../../lib/database';
import { notificationService } from '../../services/NotificationService';

export default function TestMissionConfirmation() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allUsers = await databaseService.getAllUsers();
      const driversOnly = allUsers.filter((user: User) => user.role === 'DRIVER');
      setDrivers(driversOnly);

      const allMissions = await databaseService.getAllMissions();
      const pendingMissions = allMissions.filter((mission: Mission) => mission.status === 'PENDING');
      setMissions(pendingMissions);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const testMissionConfirmation = async () => {
    if (drivers.length === 0) {
      Alert.alert('Erreur', 'Aucun chauffeur disponible pour le test');
      return;
    }

    if (missions.length === 0) {
      Alert.alert('Erreur', 'Aucune mission en attente disponible pour le test');
      return;
    }

    setLoading(true);
    try {
      const driver = drivers[0];
      const mission = missions[0];

      console.log('🧪 Test: Attribution de mission');
      console.log('Chauffeur:', driver.firstName, driver.lastName);
      console.log('Mission:', mission.title);

      // Attribuer la mission au chauffeur avec statut ASSIGNED
      await databaseService.updateMission(mission.id, {
        status: 'ASSIGNED',
        driverId: driver.id
      });

      // Envoyer la notification de confirmation
      await notificationService.notifyMissionPendingConfirmation(driver.id, {
        ...mission,
        status: 'ASSIGNED',
        driverId: driver.id
      } as Mission);

      Alert.alert(
        'Test réussi !',
        `Mission "${mission.title}" attribuée à ${driver.firstName} ${driver.lastName}.\n\nLe chauffeur devrait recevoir une notification de confirmation.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Recharger les données
              loadData();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Erreur lors du test:', error);
      Alert.alert(
        'Erreur',
        `Le test a échoué: ${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nVérifiez les logs pour plus de détails.`
      );
    } finally {
      setLoading(false);
    }
  };

  const createTestMission = async () => {
    setLoading(true);
    try {
      const testMissionId = `test-confirmation-${Date.now()}`;
      
      // Récupérer une entreprise existante
      const companies = await databaseService.getAllCompanies();
      const companyId = companies[0]?.id || 'default-company';

      // Utiliser une approche simple avec valeurs par défaut
      const departureTime = new Date();
      departureTime.setHours(departureTime.getHours() + 2);
      
      const arrivalTime = new Date(departureTime);
      arrivalTime.setHours(arrivalTime.getHours() + 1);

      const defaultDriver = drivers[0] || null;

      const testMission: Mission = {
        id: testMissionId,
        title: 'Mission Test Confirmation',
        description: 'Mission créée pour tester le système de confirmation',
        status: 'PENDING',
        departureLocation: 'Gare de Lyon',
        departureAddress: '20 Boulevard Diderot, 75012 Paris',
        departureLat: 48.8447,
        departureLng: 2.3739,
        scheduledDepartureAt: departureTime.toISOString(),
        arrivalLocation: 'Aéroport Charles de Gaulle',
        arrivalAddress: 'Aéroport Charles de Gaulle, 95700 Roissy-en-France',
        arrivalLat: 49.0097,
        arrivalLng: 2.5479,
        estimatedArrivalAt: arrivalTime.toISOString(),
        maxPassengers: 4,
        currentPassengers: 0,
        companyId: companyId,
        driverId: defaultDriver?.id || 'temp-driver',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await databaseService.createMission(testMission);

      Alert.alert('Succès', 'Mission de test créée avec succès !');
      loadData();
    } catch (error) {
      console.error('Erreur lors de la création de la mission de test:', error);
      Alert.alert('Erreur', `Impossible de créer la mission de test: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Test Confirmation Mission" 
        showLogo={true}
        style={styles.headerStyle}
      />
      
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Test du Système de Confirmation</Text>
          <Text style={styles.description}>
            Cette page permet de tester le système de confirmation de mission entre administrateurs et chauffeurs.
          </Text>

          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>Statistiques</Text>
            <Text style={styles.infoLine}>Chauffeurs disponibles: {drivers.length}</Text>
            <Text style={styles.infoLine}>Missions en attente: {missions.length}</Text>
          </Card>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={createTestMission}
              disabled={loading}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.buttonText}>Créer Mission Test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.testButton, (!drivers.length || !missions.length) && styles.disabledButton]}
              onPress={testMissionConfirmation}
              disabled={loading || !drivers.length || !missions.length}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="checkmark-circle" size={24} color="white" />
              )}
              <Text style={styles.buttonText}>
                {loading ? 'Test en cours...' : 'Tester Confirmation'}
              </Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>Instructions</Text>
            <Text style={styles.instructionsText}>
              1. Créez une mission de test si aucune n'est disponible{'\n'}
              2. Cliquez sur "Tester Confirmation" pour attribuer la mission au premier chauffeur{'\n'}
              3. Le chauffeur devrait recevoir une notification de confirmation{'\n'}
              4. Connectez-vous en tant que chauffeur pour voir la notification{'\n'}
              5. Acceptez ou refusez la mission pour tester le workflow complet
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerStyle: {
    backgroundColor: Colors.light.primary,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoLine: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButton: {
    backgroundColor: '#10b981',
  },
  testButton: {
    backgroundColor: Colors.light.primary,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: '#f8fafc',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
});