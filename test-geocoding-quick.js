// Test rapide du géocodage avec API française complète
import { SimpleCityGeocoding } from './services/SimpleCityGeocoding';
import { FrenchCityAPI } from './services/FrenchCityAPI';

const testAddresses = [
  'École primaire mondoubleau',
  'École primaire mondoublea', // avec faute de frappe
  'Mondoubleau',
  'mondoubleau centre',
  'Mairie de Mondoubleau',
  'Paris',
  'Lyon',
  'école primaire blois',
  'Prunay-Cassereau', // Petite commune du Loir-et-Cher
  'Saint-Amand-Longpré', // Très petite commune
  'Droué', // Petit village
  'Beauce la Romaine', // Nouvelle commune
];

console.log('=== TEST GÉOCODAGE AVEC API FRANÇAISE ===\n');

async function testAPI() {
  for (const address of testAddresses) {
    console.log(`🧪 Test API: "${address}"`);
    try {
      const result = await FrenchCityAPI.searchCityInText(address);
      if (result) {
        console.log(`✅ Trouvé: ${result.cityName} (${result.latitude}, ${result.longitude})`);
        if (result.population) {
          console.log(`👥 Population: ${result.population.toLocaleString()} habitants`);
        }
      } else {
        console.log(`❌ Non trouvé`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
    console.log('---');
  }
  
  console.log('\n=== STATISTIQUES CACHE ===');
  const stats = FrenchCityAPI.getCacheStats();
  console.log(`📊 ${stats.size} villes en cache`);
  console.log(`🏘️ Villes: ${stats.cities.join(', ')}`);
}

// Exécuter le test
testAPI().then(() => {
  console.log('\n✅ Test terminé!');
}).catch(error => {
  console.error('❌ Erreur test:', error);
});
