import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { GeocodingService } from '../../services/GeocodingService';
import { FrenchCityAPI } from '../../services/FrenchCityAPI';

export default function TestFrenchAPIScreen() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFrenchAPI = async () => {
    if (!address) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Test API française avec:', address);
      const apiResult = await FrenchCityAPI.searchCityInText(address);
      setResult({ type: 'api', data: apiResult });
      console.log('📍 Résultat API:', apiResult);
    } catch (error) {
      console.error('❌ Erreur:', error);
      Alert.alert('Erreur', 'Échec de la recherche API');
    } finally {
      setLoading(false);
    }
  };

  const testCompleteGeocoding = async () => {
    if (!address) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Test géocodage complet avec:', address);
      const geocodingResult = await GeocodingService.geocodeAddress(address);
      setResult({ type: 'complete', data: geocodingResult });
      console.log('📍 Résultat complet:', geocodingResult);
    } catch (error) {
      console.error('❌ Erreur:', error);
      Alert.alert('Erreur', 'Échec du géocodage complet');
    } finally {
      setLoading(false);
    }
  };

  const testPostalCode = async () => {
    const postalCode = address.match(/\d{5}/)?.[0];
    if (!postalCode) {
      Alert.alert('Erreur', 'Veuillez saisir un code postal (5 chiffres)');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Test code postal:', postalCode);
      const cities = await FrenchCityAPI.searchByPostalCode(postalCode);
      setResult({ type: 'postal', data: cities });
      console.log('📍 Villes trouvées:', cities);
    } catch (error) {
      console.error('❌ Erreur:', error);
      Alert.alert('Erreur', 'Échec de la recherche par code postal');
    } finally {
      setLoading(false);
    }
  };

  const testAddresses = [
    'Mondoubleau',
    'École primaire mondoubleau',
    'Collège de Saint-Calais',
    'Mairie de Droué',
    'Centre-ville de Savigny-sur-Braye',
    'Gare de Vendôme',
    'Château de Chambord',
    'Lycée Augustin Thierry à Blois',
    '41170', // Code postal de Mondoubleau
    'Prunay-Cassereau',
    'Saint-Amand-Longpré',
    'La Ville-aux-Clercs', // Test spécifique
    'École maternelle Mer',
    'Beauce la Romaine',
    'Auxant', // Pour comparer avec le résultat précédent
    'Ville-aux-Clercs', // Sans l'article
    'Adresse inexistante 99999',
  ];

  const clearCache = () => {
    FrenchCityAPI.clearCache();
    Alert.alert('Cache vidé', 'Le cache de l\'API française a été vidé');
  };

  const showCacheStats = () => {
    const stats = FrenchCityAPI.getCacheStats();
    Alert.alert(
      'Statistiques Cache', 
      `${stats.size} villes en cache:\n${stats.cities.slice(0, 10).join(', ')}${stats.size > 10 ? '...' : ''}`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test API Française Complète</Text>
      <Text style={styles.subtitle}>API gouvernementale - 35,000+ communes</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Saisir une adresse ou ville française..."
          placeholderTextColor="#666"
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.apiButton]}
            onPress={testFrenchAPI}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'API...' : 'Test API'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.completeButton]}
            onPress={testCompleteGeocoding}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Complet...' : 'Test Complet'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.postalButton]}
            onPress={testPostalCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Code Postal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cacheButton]}
            onPress={showCacheStats}
          >
            <Text style={styles.buttonText}>Stats Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearCache}
          >
            <Text style={styles.buttonText}>Vider Cache</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tests recommandés :</Text>
      <View style={styles.testAddressesContainer}>
        {testAddresses.map((testAddress, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testAddressButton}
            onPress={() => setAddress(testAddress)}
          >
            <Text style={styles.testAddressText}>{testAddress}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Résultat :</Text>
          
          {result.type === 'api' && (
            <View>
              <Text style={styles.resultLabel}>API Française directe :</Text>
              {result.data ? (
                <View>
                  <Text style={styles.resultText}>
                    {JSON.stringify(result.data, null, 2)}
                  </Text>
                  {result.data.population && (
                    <Text style={styles.populationText}>
                      👥 Population : {result.data.population.toLocaleString()} habitants
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.noResultText}>❌ Aucun résultat</Text>
              )}
            </View>
          )}
          
          {result.type === 'complete' && (
            <View>
              <Text style={styles.resultLabel}>Géocodage complet :</Text>
              <Text style={styles.resultText}>
                {result.data ? JSON.stringify(result.data, null, 2) : 'Aucun résultat'}
              </Text>
              
              {result.data?.isApproximate && (
                <Text style={styles.approximateWarning}>
                  ⚠️ Position approximative
                </Text>
              )}
            </View>
          )}
          
          {result.type === 'postal' && (
            <View>
              <Text style={styles.resultLabel}>Recherche par code postal :</Text>
              {result.data && result.data.length > 0 ? (
                result.data.map((city: any, index: number) => (
                  <View key={index} style={styles.cityItem}>
                    <Text style={styles.cityName}>{city.cityName}</Text>
                    <Text style={styles.cityCoords}>
                      📍 {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                    </Text>
                    {city.population && (
                      <Text style={styles.cityPopulation}>
                        👥 {city.population.toLocaleString()} hab.
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noResultText}>❌ Aucune ville trouvée</Text>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  apiButton: {
    backgroundColor: '#10b981',
  },
  completeButton: {
    backgroundColor: '#3b82f6',
  },
  postalButton: {
    backgroundColor: '#8b5cf6',
  },
  cacheButton: {
    backgroundColor: '#f59e0b',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  testAddressesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  testAddressButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  testAddressText: {
    fontSize: 12,
    color: '#495057',
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  resultText: {
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    color: '#333',
  },
  noResultText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    padding: 10,
  },
  approximateWarning: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  populationText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  cityItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  cityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cityCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cityPopulation: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
});
