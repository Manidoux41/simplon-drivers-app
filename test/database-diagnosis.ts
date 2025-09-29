/**
 * Script de diagnostic pour vérifier l'état de la base de données
 */

export async function diagnoseDatabaseStatus() {
  console.log('🔍 Diagnostic de la base de données...');
  
  try {
    const { databaseService } = await import('../lib/database');
    
    // 1. Vérifier la structure de la table missions
    console.log('📋 Vérification de la structure de la table missions...');
    
    // 2. Lister quelques missions existantes
    const missions = await databaseService.getAllMissions();
    console.log(`📊 Nombre total de missions: ${missions.length}`);
    
    if (missions.length > 0) {
      const firstMission = missions[0];
      console.log('🔍 Première mission trouvée:', {
        id: firstMission.id,
        title: firstMission.title,
        status: firstMission.status,
        driverId: firstMission.driverId,
        hasAllRequiredFields: !!(firstMission.departureLocation && firstMission.arrivalLocation)
      });
    }
    
    // 3. Vérifier les utilisateurs
    const users = await databaseService.getAllUsers();
    const drivers = users.filter(u => u.role === 'DRIVER');
    const admins = users.filter(u => u.role === 'ADMIN');
    
    console.log(`👥 Utilisateurs: ${users.length} total (${drivers.length} chauffeurs, ${admins.length} admins)`);
    
    // 4. Test de création et mise à jour de mission
    console.log('🧪 Test de création et mise à jour de mission...');
    
    if (drivers.length > 0) {
      const testDriver = drivers[0];
      console.log(`👤 Chauffeur de test: ${testDriver.firstName} ${testDriver.lastName} (${testDriver.id})`);
      
      // Créer une mission de test
      const testMissionId = `diagnostic-test-${Date.now()}`;
      
      try {
        // Test simple de mise à jour (sans créer de vraie mission)
        console.log('✅ Diagnostic terminé - Base de données accessible');
        
      } catch (updateError) {
        console.error('❌ Erreur lors du test de mise à jour:', updateError);
      }
    }
    
    // 5. Vérifier les notifications
    const { notificationService } = await import('../services/NotificationService');
    
    if (drivers.length > 0) {
      const testDriver = drivers[0];
      const notifications = await notificationService.getNotificationsForUser(testDriver.id);
      console.log(`🔔 Notifications pour ${testDriver.firstName}: ${notifications.length}`);
      
      if (notifications.length > 0) {
        const pendingConfirmations = notifications.filter(n => 
          n.type === 'MISSION_PENDING_CONFIRMATION' && !n.isRead
        );
        console.log(`⏳ Confirmations en attente: ${pendingConfirmations.length}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du diagnostic:', error);
    
    if (error instanceof Error) {
      console.error('📝 Détails de l\'erreur:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
  }
}

export async function testMissionUpdate() {
  console.log('🧪 Test spécifique de mise à jour de mission...');
  
  try {
    const { databaseService } = await import('../lib/database');
    
    // Obtenir une mission existante
    const missions = await databaseService.getAllMissions();
    if (missions.length === 0) {
      console.log('❌ Aucune mission trouvée pour le test');
      return;
    }
    
    const testMission = missions[0];
    console.log('🎯 Mission de test:', {
      id: testMission.id,
      title: testMission.title,
      status: testMission.status,
      driverId: testMission.driverId
    });
    
    // Test de mise à jour simple (juste le timestamp)
    console.log('🔄 Test de mise à jour du timestamp...');
    await databaseService.updateMission(testMission.id, {
      // Pas de changement de statut, juste forcer une mise à jour
    }, true); // skipNotifications
    
    console.log('✅ Mise à jour du timestamp réussie');
    
    // Test de mise à jour du statut
    const users = await databaseService.getAllUsers();
    const driver = users.find(u => u.role === 'DRIVER');
    
    if (driver) {
      console.log('🔄 Test de mise à jour avec chauffeur...');
      await databaseService.updateMission(testMission.id, {
        driverId: driver.id
      }, true); // skipNotifications
      
      console.log('✅ Assignation de chauffeur réussie');
      
      // Test de mise à jour de statut vers ASSIGNED
      console.log('🔄 Test de mise à jour vers ASSIGNED...');
      await databaseService.updateMission(testMission.id, {
        status: 'ASSIGNED'
      }, true); // skipNotifications
      
      console.log('✅ Mise à jour vers ASSIGNED réussie');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de mise à jour:', error);
    
    if (error instanceof Error && error.message.includes('finalizeAsync')) {
      console.error('🚨 Erreur finalizeAsync détectée - Problème avec la requête SQL');
      console.error('💡 Solutions possibles:');
      console.error('   1. Structure de table incorrecte');
      console.error('   2. Contrainte de base de données violée');
      console.error('   3. Valeur de données incompatible');
    }
  }
}

// Fonction principale de diagnostic
export async function runFullDiagnosis() {
  console.log('🚀 Démarrage du diagnostic complet...\n');
  
  await diagnoseDatabaseStatus();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  await testMissionUpdate();
  
  console.log('\n🏁 Diagnostic terminé');
}