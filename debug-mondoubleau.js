import { SimpleCityGeocoding } from '../services/SimpleCityGeocoding';

// Test spécifique pour "École primaire mondoubleau"
const testAddress = 'École primaire mondoubleau';
console.log('\n=== TEST SPÉCIFIQUE MONDOUBLEAU ===');
console.log(`Test de: "${testAddress}"`);

const result = SimpleCityGeocoding.geocodeByCity(testAddress);
if (result) {
  console.log('✅ SUCCÈS!');
  console.log(`Résultat: ${result.address}`);
  console.log(`Coordonnées: ${result.latitude}, ${result.longitude}`);
  console.log(`Approximatif: ${result.isApproximate}`);
} else {
  console.log('❌ ÉCHEC - Aucun résultat trouvé');
  
  // Test du fallback
  console.log('\n--- Test du fallback ---');
  const fallback = SimpleCityGeocoding.intelligentGeocode(testAddress);
  console.log(`Fallback: ${fallback.address}`);
  console.log(`Coordonnées: ${fallback.latitude}, ${fallback.longitude}`);
}

// Test avec variation
const testAddress2 = 'mondoubleau';
console.log(`\nTest simple: "${testAddress2}"`);
const result2 = SimpleCityGeocoding.geocodeByCity(testAddress2);
if (result2) {
  console.log('✅ Trouvé!');
  console.log(`Résultat: ${result2.address}`);
} else {
  console.log('❌ Non trouvé');
}

console.log('\n=== FIN TEST ===');
