import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IntegratedRouteMap } from '../../components/IntegratedRouteMap';
import { RouteCalculationService, RouteResult } from '../../services/RouteCalculationService';
import { Colors } from '../../constants/Colors';

export default function TestRouteIntegrationScreen() {
  const [testResults, setTestResults] = React.useState<string[]>([]);
  const [calculatedRoute, setCalculatedRoute] = React.useState<RouteResult | null>(null);

  // Points de test en France
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
    }
  };

  const testFallbackCalculation = async () => {
    addTestResult(`🧪 Test calcul de distance de fallback`);
    
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const marseille = { latitude: 43.2965, longitude: 5.3698 };
    
    const distance = RouteCalculationService.calculateStraightLineDistance(paris, marseille);
    addTestResult(`📏 Distance à vol d'oiseau: ${distance.toFixed(2)} km`);
  };

  const testCaching = async () => {
    addTestResult(`🧪 Test du système de cache`);
    
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
  };

  const clearResults = () => {
    setTestResults([]);
    setCalculatedRoute(null);
  };

  const handleRouteCalculated = (route: RouteResult) => {
    addTestResult(`🗺️ Route mise à jour depuis la carte`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test d'Intégration - Calcul d'Itinéraires</Text>
        <Text style={styles.subtitle}>
          Tests des services de calcul d'itinéraire et composants de carte
        </Text>
      </View>

      {/* Boutons de test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tests automatisés</Text>
        
        <View style={styles.buttonGrid}>
          {testPoints.map((point, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testButton}
              onPress={() => testRouteCalculation(point)}
            >
              <Ionicons name="map" size={20} color="#fff" />
              <Text style={styles.testButtonText}>{point.name}</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.testButton, styles.fallbackButton]}
            onPress={testFallbackCalculation}
          >
            <Ionicons name="calculator" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Distance Fallback</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, styles.cacheButton]}
            onPress={testCaching}
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

      {/* Composant de carte intégrée (test visuel) */}
      {calculatedRoute && testPoints[0] && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aperçu Carte Intégrée</Text>
          <IntegratedRouteMap
            startPoint={testPoints[0].start}
            endPoint={testPoints[0].end}
            startAddress="Paris, France"
            endAddress="Marseille, France"
            onRouteCalculated={handleRouteCalculated}
            editable={true}
            onEditRoute={() => addTestResult('🔧 Édition de route demandée')}
            style={styles.mapPreview}
          />
        </View>
      )}

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
        </View>
      )}
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
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  mapPreview: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
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
});
