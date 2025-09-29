// Script pour tester la migration du statut ASSIGNED
const { databaseService, forceDatabaseMigrations } = require('./lib/database');

async function testAssignedStatus() {
  try {
    console.log('🚀 Test de la migration ASSIGNED...');
    
    // Initialiser la base de données
    await databaseService.init();
    console.log('✅ Base de données initialisée');
    
    // Forcer les migrations
    console.log('🔄 Forçage des migrations...');
    await forceDatabaseMigrations();
    console.log('✅ Migrations forcées terminées');
    
    // Tester l'insertion d'une mission avec le statut ASSIGNED
    console.log('🧪 Test d\'insertion avec statut ASSIGNED...');
    const testMissionId = `test-assigned-${Date.now()}`;
    
    const result = await databaseService.db.runAsync(`
      INSERT INTO missions (
        id, title, status, driverId, 
        departureLocation, departureAddress, 
        departureLat, departureLng, scheduledDepartureAt,
        arrivalLocation, arrivalAddress, 
        arrivalLat, arrivalLng, estimatedArrivalAt,
        maxPassengers, companyId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testMissionId, 'Test Mission ASSIGNED', 'ASSIGNED', null,
      'Départ Test', '123 Rue Test', 48.8566, 2.3522, new Date().toISOString(),
      'Arrivée Test', '456 Avenue Test', 48.8606, 2.3376, new Date().toISOString(),
      4, 'test-company'
    ]);
    
    console.log('✅ Mission avec statut ASSIGNED créée avec succès!');
    console.log('Result:', result);
    
    // Vérifier que la mission a été créée
    const createdMission = await databaseService.db.getFirstAsync(
      'SELECT * FROM missions WHERE id = ?', [testMissionId]
    );
    
    console.log('📋 Mission créée:', createdMission);
    
    // Nettoyer - supprimer la mission de test
    await databaseService.db.runAsync('DELETE FROM missions WHERE id = ?', [testMissionId]);
    console.log('🧹 Mission de test supprimée');
    
    console.log('🎉 Test réussi! Le statut ASSIGNED fonctionne correctement.');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

// Exécuter le test
testAssignedStatus()
  .then(() => {
    console.log('✅ Test terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test échoué:', error);
    process.exit(1);
  });