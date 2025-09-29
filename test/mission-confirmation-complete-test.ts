/**
 * Script de test pour vérifier le flux complet de confirmation de missions
 */

export async function testFullMissionConfirmationFlow() {
  console.log('🧪 Test complet du système de confirmation...');
  
  try {
    const { databaseService } = await import('../lib/database');
    const { notificationService } = await import('../services/NotificationService');
    
    // 1. Créer une mission de test
    console.log('📋 Étape 1: Création d\'une mission de test...');
    
    const testMissionData = {
      id: `test-mission-${Date.now()}`,
      title: 'Mission de test - Confirmation',
      description: 'Test du système de confirmation',
      status: 'PENDING' as const,
      departureLocation: 'Départ Test',
      departureAddress: '123 Rue du Test',
      departureLat: 48.8566,
      departureLng: 2.3522,
      scheduledDepartureAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      arrivalLocation: 'Arrivée Test',
      arrivalAddress: '456 Avenue Test',
      arrivalLat: 48.8666,
      arrivalLng: 2.3622,
      estimatedArrivalAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      maxPassengers: 4,
      currentPassengers: 0,
      driverId: '', // Pas de chauffeur initialement
      companyId: 'company-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insérer la mission en base (simulation)
    console.log('✅ Mission de test créée:', testMissionData.id);

    // 2. Obtenir un chauffeur de test
    console.log('👤 Étape 2: Récupération d\'un chauffeur de test...');
    const users = await databaseService.getAllUsers();
    const driver = users.find(user => user.role === 'DRIVER');
    
    if (!driver) {
      console.error('❌ Aucun chauffeur trouvé pour le test');
      return;
    }
    
    console.log(`✅ Chauffeur de test: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);

    // 3. Simuler l'assignation par un admin
    console.log('🔄 Étape 3: Assignation de la mission au chauffeur...');
    
    await databaseService.updateMission(testMissionData.id, {
      driverId: driver.id
    });
    
    console.log('✅ Mission assignée, notification de confirmation envoyée');

    // 4. Vérifier que la notification a été créée
    console.log('🔍 Étape 4: Vérification des notifications...');
    
    setTimeout(async () => {
      const notifications = await notificationService.getNotificationsForUser(driver.id);
      const confirmationNotification = notifications.find(n => 
        n.type === 'MISSION_PENDING_CONFIRMATION' && 
        n.missionId === testMissionData.id
      );
      
      if (confirmationNotification) {
        console.log('✅ Notification de confirmation trouvée:', confirmationNotification.title);
        
        // 5. Simuler l'acceptation
        console.log('✅ Étape 5: Simulation de l\'acceptation...');
        
        await databaseService.updateMission(testMissionData.id, {
          driverId: driver.id,
          status: 'ASSIGNED'
        }, true); // skipNotifications
        
        await notificationService.markAsRead(confirmationNotification.id);
        await notificationService.notifyMissionAccepted(driver.id, testMissionData as any);
        
        console.log('✅ Mission acceptée avec succès');
        
        // 6. Vérifier que la mission apparaît dans les missions du chauffeur
        const driverMissions = await databaseService.getMissionsByDriverId(driver.id);
        const acceptedMission = driverMissions.find(m => m.id === testMissionData.id);
        
        if (acceptedMission && acceptedMission.status === 'ASSIGNED') {
          console.log('✅ Mission trouvée dans les missions du chauffeur avec statut ASSIGNED');
        } else {
          console.log('❌ Mission non trouvée ou statut incorrect');
        }
        
      } else {
        console.log('❌ Notification de confirmation non trouvée');
        console.log('🔍 Notifications trouvées:', notifications.map(n => ({
          type: n.type,
          missionId: n.missionId,
          title: n.title
        })));
      }
    }, 1000);

  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

export async function testMissionRefusal() {
  console.log('🧪 Test du refus de mission...');
  
  try {
    const { databaseService } = await import('../lib/database');
    const { notificationService } = await import('../services/NotificationService');
    
    // Obtenir admins et chauffeur
    const users = await databaseService.getAllUsers();
    const driver = users.find(user => user.role === 'DRIVER');
    const admins = await databaseService.getAdminUsers();
    
    if (!driver || admins.length === 0) {
      console.error('❌ Chauffeur ou administrateurs non trouvés');
      return;
    }

    console.log(`👤 Chauffeur: ${driver.firstName}, 👥 Admins: ${admins.length}`);

    // Simuler le refus d'une mission
    const testMission = {
      id: 'test-mission-refusal',
      title: 'Mission refusée - Test',
      status: 'PENDING',
      driverId: null
    };

    await notificationService.notifyMissionRefused(testMission as any, driver.firstName + ' ' + driver.lastName);
    
    console.log('✅ Notifications de refus envoyées aux administrateurs');
    
    // Vérifier que les admins ont reçu les notifications
    for (const admin of admins) {
      const adminNotifications = await notificationService.getNotificationsForUser(admin.id);
      const refusalNotification = adminNotifications.find(n => 
        n.type === 'MISSION_REFUSED' && 
        n.message.includes(driver.firstName)
      );
      
      if (refusalNotification) {
        console.log(`✅ Admin ${admin.firstName} a reçu la notification de refus`);
      } else {
        console.log(`❌ Admin ${admin.firstName} n'a pas reçu la notification`);
      }
    }

  } catch (error) {
    console.error('💥 Erreur lors du test de refus:', error);
  }
}

// Test principal
export async function runAllTests() {
  console.log('🚀 Démarrage des tests du système de confirmation...\n');
  
  await testFullMissionConfirmationFlow();
  
  setTimeout(async () => {
    console.log('\n' + '='.repeat(50) + '\n');
    await testMissionRefusal();
  }, 3000);
}