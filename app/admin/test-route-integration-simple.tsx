import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteCalculationService, RouteResult } from '../../services/RouteCalculationService';
import { Colors } from '../../constants/Colors';

export default function TestRouteIntegrationScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [calculatedRoute, setCalculatedRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testPoints = [
    {
      name: "Paris - Marseille",
      start: { latitude: 48.8566, longitude: 2.3522 },
      end: { latitude: 43.2965, longitude: 5.3698 }
    },
    {
      name: "Lyon - Bordeaux", 
      start: { latitude: 45.7640, longitude: 4.8357 },
      end: { latitude: 44.8378, longitude: -0.5792 }
    },
    {
      name: "Toulouse - Nice",
      start: { latitude: 43.6047, longitude: 1.4442 },
      end: { latitude: 43.7102, longitude: 7.2620 }
    }
  ];

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRouteCalculation = async (testPoint: typeof testPoints[0]) => {
    if (loading) return;
    
    setLoading(true);
    addTestResult(`🧪 Test calcul itinéraire: ${testPoint.name}`);
    
    try {
      const route = await RouteCalculationService.calculateRoute(
        testPoint.start,
        testPoint.end,
        'driving-car'
      );

      if (route) {
        addTestResult(`✅ Itinéraire calculé avec succès`);
        addTestResult(`📏 Distance: ${route.summary.totalDistance}`);
        addTestResult(`⏱️ Durée: ${route.summary.totalDuration}`);
        addTestResult(`🗺️ Points de route: ${route.polyline.length}`);
        
        if (route.summary.estimatedFuelCost) {
          addTestResult(`⛽ Coût carburant estimé: ${route.summary.estimatedFuelCost.toFixed(2)}€`);
        }
        
        setCalculatedRoute(route);
      } else {
        addTestResult(`❌ Échec du calcul d'itinéraire`);
      }
    } catch (error: any) {
      addTestResult(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFallbackCalculation = async () => {
    if (loading) return;
    
    setLoading(true);
    addTestResult(`🧪 Test calcul de distance de fallback`);
    
    try {
      const paris = { latitude: 48.8566, longitude: 2.3522 };
      const marseille = { latitude: 43.2965, longitude: 5.3698 };
      
      const distance = RouteCalculationService.calculateStraightLineDistance(paris, marseille);
      addTestResult(`📏 Distance à vol d'oiseau: ${distance.toFixed(2)} km`);
    } catch (error: any) {
      addTestResult(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCaching = async () => {
    if (loading) return;
    
    setLoading(true);
    addTestResult(`🧪 Test du système de cache`);
    
    try {
      const start = testPoints[0].start;
      const end = testPoints[0].end;
      
      // Premier appel
      const startTime1 = Date.now();
      await RouteCalculationService.calculateRoute(start, end);
      const duration1 = Date.now() - startTime1;
      addTestResult(`⏱️ Premier appel: ${duration1}ms`);
      
      // Deuxième appel (depuis le cache)
      const startTime2 = Date.now();
      await RouteCalculationService.calculateRoute(start, end);
      const duration2 = Date.now() - startTime2;
      addTestResult(`⏱️ Deuxième appel (cache): ${duration2}ms`);
      
      if (duration2 < duration1) {
        addTestResult(`✅ Cache fonctionne - accélération de ${duration1 - duration2}ms`);
      }
    } catch (error: any) {
      addTestResult(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setCalculatedRoute(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test d'Intégration - Calcul d'Itinéraires</Text>
        <Text style={styles.subtitle}>
          Tests des services de calcul d'itinéraire (version simplifiée)
        </Text>
      </View>

      {/* Boutons de test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests automatisés</Text>
        
        <View style={styles.buttonGrid}>
          {testPoints.map((point, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.testButton, loading && styles.disabledButton]}
              onPress={() => testRouteCalculation(point)}
              disabled={loading}
            >
              <Ionicons name="map" size={20} color="#fff" />
              <Text style={styles.testButtonText}>{point.name}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.testButton, styles.fallbackButton, loading && styles.disabledButton]}
            onPress={testFallbackCalculation}
            disabled={loading}
          >
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Distance Fallback</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, styles.cacheButton, loading && styles.disabledButton]}
            onPress={testCaching}
            disabled={loading}
          >
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, styles.clearButton]}
            onPress={clearResults}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Effacer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Résultats des tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résultats des Tests</Text>
        <View style={styles.resultsContainer}>
          {testResults.length === 0 ? (
            <Text style={styles.noResults}>
              Aucun test exécuté. Utilisez les boutons ci-dessus pour commencer.
            </Text>
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </View>

      {/* Statistiques détaillées */}
      {calculatedRoute && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de l'Itinéraire</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distance totale:</Text>
              <Text style={styles.detailValue}>{calculatedRoute.summary.totalDistance}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durée totale:</Text>
              <Text style={styles.detailValue}>{calculatedRoute.summary.totalDuration}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Points de route:</Text>
              <Text style={styles.detailValue}>{calculatedRoute.polyline.length}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Segments:</Text>
              <Text style={styles.detailValue}>{calculatedRoute.segments.length}</Text>
            </View>
            {calculatedRoute.summary.estimatedFuelCost && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coût carburant:</Text>
                <Text style={styles.detailValue}>
                  {calculatedRoute.summary.estimatedFuelCost.toFixed(2)}€
                </Text>
              </View>
            )}
          </View>

          {/* Aperçu des segments */}
          {calculatedRoute.segments.length > 0 && (
            <View style={styles.segmentsSection}>
              <Text style={styles.sectionTitle}>Instructions de Navigation</Text>
              {calculatedRoute.segments.slice(0, 5).map((segment, index) => (
                <View key={index} style={styles.segmentItem}>
                  <Text style={styles.segmentNumber}>{index + 1}</Text>
                  <View style={styles.segmentContent}>
                    <Text style={styles.segmentInstruction}>{segment.instruction}</Text>
                    <Text style={styles.segmentDistance}>
                      {segment.distance.toFixed(1)} km - {Math.round(segment.duration)} min
                    </Text>
                  </View>
                </View>
              ))}
              {calculatedRoute.segments.length > 5 && (
                <Text style={styles.moreSegments}>
                  ... et {calculatedRoute.segments.length - 5} autres étapes
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Note sur les cartes */}
      <View style={styles.section}>
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle" size={24} color={Colors.light.primary} />
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Version Simplifiée</Text>
            <Text style={styles.noteText}>
              Cette version utilise les calculs d'itinéraires sans affichage de carte. 
              L'intégration complète avec cartes nécessite la configuration d'Expo Maps.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: Colors.light.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  testButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '45%',
  },
  fallbackButton: {
    backgroundColor: '#ff6b6b',
  },
  cacheButton: {
    backgroundColor: '#51cf66',
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  disabledButton: {
    backgroundColor: '#dee2e6',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  resultsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    maxHeight: 300,
  },
  noResults: {
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  detailsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  segmentsSection: {
    marginTop: 16,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  segmentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginRight: 12,
    minWidth: 20,
  },
  segmentContent: {
    flex: 1,
  },
  segmentInstruction: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  segmentDistance: {
    fontSize: 12,
    color: '#666',
  },
  moreSegments: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
