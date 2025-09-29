/**
 * Script de test simple pour vérifier que le statut ASSIGNED fonctionne
 * Utilise directement expo-sqlite pour tester la base de données
 */

import * as SQLite from 'expo-sqlite';

const TEST_DB_NAME = 'simplon-drivers.db';

async function testAssignedStatus() {
  console.log('🚀 Test du statut ASSIGNED...');
  
  try {
    // Ouvrir la base de données
    const db = await SQLite.openDatabaseAsync(TEST_DB_NAME);
    console.log('✅ Base de données ouverte');

    // Vérifier la structure de la table missions
    console.log('🔍 Vérification de la structure de la table missions...');
    const tableInfo = await db.getAllAsync(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='missions'
    `);
    
    if (tableInfo.length > 0) {
      console.log('📋 Structure de la table missions:');
      console.log(tableInfo[0].sql);
      
      // Vérifier si ASSIGNED est dans la contrainte CHECK
      const supportsAssigned = tableInfo[0].sql.includes("'ASSIGNED'");
      console.log(`🔍 Support du statut ASSIGNED: ${supportsAssigned ? '✅ OUI' : '❌ NON'}`);
      
      if (!supportsAssigned) {
        console.log('⚠️  La table ne supporte pas encore le statut ASSIGNED');
        console.log('💡 La migration devrait se déclencher au prochain démarrage de l\'app');
        return;
      }
    } else {
      console.log('❌ Table missions introuvable');
      return;
    }

    // Test d'insertion avec le statut ASSIGNED
    console.log('🧪 Test d\'insertion avec statut ASSIGNED...');
    const testId = `test-assigned-${Date.now()}`;
    
    try {
      await db.runAsync(`
        INSERT INTO missions (
          id, title, status, driverId,
          departureLocation, departureAddress, departureLat, departureLng,
          scheduledDepartureAt, arrivalLocation, arrivalAddress,
          arrivalLat, arrivalLng, estimatedArrivalAt,
          maxPassengers, companyId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testId, 'Test ASSIGNED Status', 'ASSIGNED', null,
        'Test Départ', 'Adresse Test', 0, 0, new Date().toISOString(),
        'Test Arrivée', 'Adresse Arrivée', 0, 0, new Date().toISOString(),
        1, 'test-company'
      ]);
      
      console.log('✅ Mission avec statut ASSIGNED créée avec succès!');
      
      // Vérifier que la mission a été créée
      const mission = await db.getFirstAsync(
        'SELECT * FROM missions WHERE id = ?', [testId]
      );
      
      if (mission) {
        console.log('📋 Mission créée:', {
          id: mission.id,
          title: mission.title,
          status: mission.status,
          driverId: mission.driverId
        });
      }
      
      // Nettoyer - supprimer la mission de test
      await db.runAsync('DELETE FROM missions WHERE id = ?', [testId]);
      console.log('🧹 Mission de test supprimée');
      
      console.log('🎉 Test réussi! Le statut ASSIGNED fonctionne correctement.');
      
    } catch (insertError) {
      console.error('❌ Erreur lors de l\'insertion avec statut ASSIGNED:', insertError);
      
      if (insertError.message && insertError.message.includes('CHECK constraint')) {
        console.log('💡 La contrainte CHECK empêche encore l\'utilisation du statut ASSIGNED');
        console.log('🔄 Redémarrez l\'application pour déclencher la migration');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

export { testAssignedStatus };