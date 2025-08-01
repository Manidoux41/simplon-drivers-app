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
import { SimpleCityGeocoding } from '../../services/SimpleCityGeocoding';

export default function TestGeocodingScreen() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGeocodingService = async () => {
    if (!address) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse');
      return;
    }

    setLoading(true);
    try {
      console.log('🧪 Test du service de géocodage avec:', address);
      const geocodingResult = await GeocodingService.geocodeAddress(address);
      setResult(geocodingResult);
      console.log('📍 Résultat:', geocodingResult);
    } catch (error) {
      console.error('❌ Erreur:', error);
      Alert.alert('Erreur', 'Échec du géocodage');
    } finally {
      setLoading(false);
    }
  };

  const testSimpleCityGeocoding = () => {
    if (!address) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse');
      return;
    }

    console.log('🧪 Test du géocodage simple avec:', address);
    const cityResult = SimpleCityGeocoding.geocodeByCity(address);
    const intelligentResult = SimpleCityGeocoding.intelligentGeocode(address);
    
    setResult({
      cityResult,
      intelligentResult,
      type: 'simple'
    });
  };

  const testAddresses = [
    'Paris',
    'Lyon',
    'Marseille',
    'Toulouse',
    'Nice',
    'Strasbourg',
    'Bordeaux',
    'Lille',
    'Rennes',
    'Montpellier',
    'Aix-en-Provence',
    'Clermont-Ferrand',
    'Tours',
    'Limoges',
    'Mondoubleau',
    'École primaire mondoubleau',
    'École primaire mondoublea',
    'Blois',
    'Vendôme',
    'Le Mans',
    'Chartres',
    'Adresse inexistante 123',
    '123 rue de la paix, Paris',
    'Place de la République, Lyon',
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test de Géocodage Intelligent</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Saisir une adresse..."
          placeholderTextColor="#666"
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testGeocodingService}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Test...' : 'Test Complet'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testSimpleCityGeocoding}
          >
            <Text style={styles.buttonText}>Test Simple</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Adresses de test :</Text>
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
          
          {result.type === 'simple' ? (
            <View>
              <Text style={styles.resultLabel}>Recherche par ville :</Text>
              <Text style={styles.resultText}>
                {result.cityResult ? JSON.stringify(result.cityResult, null, 2) : 'Aucun résultat'}
              </Text>
              
              <Text style={styles.resultLabel}>Géocodage intelligent :</Text>
              <Text style={styles.resultText}>
                {JSON.stringify(result.intelligentResult, null, 2)}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.resultLabel}>Service complet :</Text>
              <Text style={styles.resultText}>
                {result ? JSON.stringify(result, null, 2) : 'Aucun résultat'}
              </Text>
              
              {result?.isApproximate && (
                <Text style={styles.approximateWarning}>
                  ⚠️ Position approximative
                </Text>
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
    marginBottom: 20,
    color: '#333',
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
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  testAddressText: {
    fontSize: 14,
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
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
    color: '#333',
  },
  approximateWarning: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
});
