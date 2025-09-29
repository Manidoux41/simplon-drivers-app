import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { heavyVehicleRouteService, OptimizedRoute } from '../services/HeavyVehicleRouteService';

interface RouteTestProps {
  onClose: () => void;
}

export const RouteOptimizationTest: React.FC<RouteTestProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizedRoute | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Coordonnées de test : Paris -> Lyon
  const testCoordinates = {
    origin: { latitude: 48.8566, longitude: 2.3522 }, // Paris
    destination: { latitude: 45.7640, longitude: 4.8357 } // Lyon
  };

  // Véhicule de test : Poids lourd
  const testVehicle = {
    weight: 32, // 32 tonnes
    height: 4.0,
    width: 2.55,
    length: 16.5,
    hazmat: false,
    licensePlate: 'TEST-PL-001',
    category: 'Poids Lourd'
  };

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Test d\'optimisation d\'itinéraire poids lourd (SERVICES GRATUITS)');
      console.log('📍 Départ: Paris (48.8566, 2.3522)');
      console.log('📍 Arrivée: Lyon (45.7640, 4.8357)');
      console.log('🚛 Véhicule: 32t, 4.0m hauteur');

      const vehicleOptions = heavyVehicleRouteService.buildVehicleOptions(testVehicle);
      console.log('⚙️ Options véhicule:', vehicleOptions);

      // Ajouter un timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout après 30 secondes')), 30000);
      });

      const routePromise = heavyVehicleRouteService.calculateHeavyVehicleRoute(
        testCoordinates.origin,
        testCoordinates.destination,
        vehicleOptions
      );

      const optimizedRoute = await Promise.race([routePromise, timeoutPromise]) as OptimizedRoute;

      console.log('✅ Itinéraire calculé avec services gratuits:', {
        distance: `${(optimizedRoute.distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(optimizedRoute.duration / 60)} min`,
        warnings: optimizedRoute.warnings.length,
        restrictions: optimizedRoute.restrictions.length,
        instructions: optimizedRoute.instructions.length,
        service: optimizedRoute.warnings.find(w => w.includes('OpenStreetMap')) ? 'OSRM' : 
                optimizedRoute.warnings.find(w => w.includes('basique')) ? 'Simulation' : 'Spécialisé'
      });

      setResult(optimizedRoute);

      const serviceUsed = optimizedRoute.warnings.find(w => w.includes('OpenStreetMap')) ? 'OpenStreetMap (OSRM)' : 
                         optimizedRoute.warnings.find(w => w.includes('basique')) ? 'Simulation basique' : 'Service spécialisé';

      Alert.alert(
        'Test Réussi! 🎉',
        `Itinéraire calculé avec ${serviceUsed}:\n\n• Distance: ${(optimizedRoute.distance / 1000).toFixed(1)} km\n• Durée: ${Math.round(optimizedRoute.duration / 60)} min\n• Avertissements: ${optimizedRoute.warnings.length}\n• Restrictions: ${optimizedRoute.restrictions.length}`,
        [{ text: 'Parfait!' }]
      );

    } catch (testError) {
      const errorMessage = testError instanceof Error ? testError.message : 'Erreur inconnue';
      console.error('❌ Erreur de test:', testError);
      setError(errorMessage);
      
      Alert.alert(
        'Erreur de Test',
        `Le test a échoué:\n${errorMessage}\n\n💡 Le service utilise maintenant uniquement des APIs gratuites (OpenStreetMap).\n\nVérifiez votre connexion internet.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testVehicleDetection = () => {
    const isHeavy = heavyVehicleRouteService.isHeavyVehicle(testVehicle);
    const weight = heavyVehicleRouteService.extractVehicleWeight(testVehicle);
    
    Alert.alert(
      'Test Détection Véhicule',
      `Véhicule: ${testVehicle.licensePlate}\nPoids détecté: ${weight}t\nPoids lourd: ${isHeavy ? 'OUI' : 'NON'}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test Optimisation Itinéraire</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Tests Disponibles</Text>
          
          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testVehicleDetection}
          >
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.testButtonText}>Test Détection Véhicule</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, styles.primaryButton]} 
            onPress={runTest}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="navigate" size={20} color="white" />
            )}
            <Text style={styles.testButtonText}>
              {isLoading ? 'Test en cours...' : 'Test Calcul Itinéraire'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Données de Test</Text>
          <View style={styles.testData}>
            <Text style={styles.testDataLabel}>Départ:</Text>
            <Text style={styles.testDataValue}>Paris (48.8566, 2.3522)</Text>
          </View>
          <View style={styles.testData}>
            <Text style={styles.testDataLabel}>Destination:</Text>
            <Text style={styles.testDataValue}>Lyon (45.7640, 4.8357)</Text>
          </View>
          <View style={styles.testData}>
            <Text style={styles.testDataLabel}>Véhicule:</Text>
            <Text style={styles.testDataValue}>{testVehicle.licensePlate} - {testVehicle.weight}t</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆓 Services Utilisés</Text>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceText}>
              ✅ OpenStreetMap (OSRM) - Gratuit{'\n'}
              ✅ Calcul basique de secours{'\n'}
              ❌ Google Maps - Retiré (payant){'\n'}
              ⏸️ HERE Maps - Optionnel (payant){'\n'}
              ⏸️ OpenRouteService - Optionnel (payant)
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorTitle}>❌ Erreur</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>✅ Résultats</Text>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Distance:</Text>
              <Text style={styles.resultValue}>{(result.distance / 1000).toFixed(1)} km</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Durée:</Text>
              <Text style={styles.resultValue}>{Math.round(result.duration / 60)} min</Text>
            </View>

            {result.tollInfo && (
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Péages:</Text>
                <Text style={styles.resultValue}>
                  {result.tollInfo.totalCost.toFixed(2)} {result.tollInfo.currency}
                </Text>
              </View>
            )}

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Avertissements:</Text>
              <Text style={styles.resultValue}>{result.warnings.length}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Restrictions:</Text>
              <Text style={styles.resultValue}>{result.restrictions.length}</Text>
            </View>

            {result.warnings.length > 0 && (
              <View style={styles.warningsContainer}>
                <Text style={styles.warningsTitle}>⚠️ Avertissements</Text>
                {result.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>• {warning}</Text>
                ))}
              </View>
            )}

            {result.restrictions.length > 0 && (
              <View style={styles.restrictionsContainer}>
                <Text style={styles.restrictionsTitle}>🚫 Restrictions</Text>
                {result.restrictions.map((restriction, index) => (
                  <Text key={index} style={styles.restrictionText}>
                    {restriction.severity === 'error' ? '🔴' : '🟡'} {restriction.description}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  testDataLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  testDataValue: {
    fontSize: 14,
    color: Colors.light.text,
  },
  errorSection: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#7f1d1d',
  },
  resultSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  warningsContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 2,
  },
  restrictionsContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  restrictionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  restrictionText: {
    fontSize: 12,
    color: '#7f1d1d',
    marginBottom: 2,
  },
  serviceInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.info,
  },
  serviceText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
});