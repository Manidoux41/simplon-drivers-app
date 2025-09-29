/**
 * Script de test pour vérifier le système de confirmation de missions
 */

import { databaseService } from '../lib/database';
import { notificationService } from '../services/NotificationService';

export async function testMissionConfirmationFlow() {
  console.log('🧪 Test du système de confirmation de missions...');
  
  try {
    // 1. Obtenir un chauffeur existant
    const users = await databaseService.getAllUsers();
    const drivers = users.filter(user => user.role === 'DRIVER');
    
    if (drivers.length === 0) {
      console.error('❌ Aucun chauffeur trouvé pour le test');
      return;
    }
    
    const testDriver = drivers[0];
    console.log(`👤 Chauffeur de test: ${testDriver.firstName} ${testDriver.lastName} (ID: ${testDriver.id})`);
    
    // 2. Obtenir une mission existante
    const missions = await databaseService.getAllMissions();
    const availableMissions = missions.filter(mission => mission.status === 'PENDING' && !mission.driverId);
    
    if (availableMissions.length === 0) {
      console.error('❌ Aucune mission disponible pour le test');
      return;
    }
    
    const testMission = availableMissions[0];
    console.log(`🚚 Mission de test: ${testMission.title} (ID: ${testMission.id})`);
    
    // 3. Simuler l'assignation de mission par un administrateur
    console.log(`📋 Assignation de la mission "${testMission.title}" au chauffeur ${testDriver.firstName}...`);
    
    await databaseService.updateMission(testMission.id, {
      driverId: testDriver.id
    });
    
    // 4. Vérifier que la notification a été créée
    setTimeout(async () => {
      const notifications = await notificationService.getNotificationsForUser(testDriver.id);
      const confirmationNotifications = notifications.filter(n => 
        n.type === 'MISSION_PENDING_CONFIRMATION' && 
        n.missionId === testMission.id
      );
      
      if (confirmationNotifications.length > 0) {
        console.log('✅ Notification de confirmation créée avec succès !');
        console.log('📄 Détails:', confirmationNotifications[0]);
      } else {
        console.log('❌ Aucune notification de confirmation trouvée');
        console.log('🔍 Toutes les notifications du chauffeur:', notifications);
      }
    }, 1000);
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

export async function testNotificationStorage() {
  console.log('🧪 Test du stockage des notifications...');
  
  try {
    const users = await databaseService.getAllUsers();
    const drivers = users.filter(user => user.role === 'DRIVER');
    
    if (drivers.length === 0) {
      console.error('❌ Aucun chauffeur trouvé');
      return;
    }
    
    const testDriver = drivers[0];
    
    // Créer une notification de test directement
    const testNotificationId = await databaseService.storeNotification({
      userId: testDriver.id,
      type: 'MISSION_PENDING_CONFIRMATION',
      title: 'Test de notification',
      message: 'Ceci est un test',
      missionId: 'test-mission-123',
      missionTitle: 'Mission de test',
      isRead: false,
      requiresAction: true,
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Notification de test créée avec ID:', testNotificationId);
    
    // Récupérer les notifications
    const notifications = await notificationService.getNotificationsForUser(testDriver.id);
    console.log('📄 Notifications récupérées:', notifications.length);
    
    const testNotification = notifications.find(n => n.id === testNotificationId);
    if (testNotification) {
      console.log('✅ Notification de test trouvée:', testNotification);
    } else {
      console.log('❌ Notification de test non trouvée');
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du test de stockage:', error);
  }
}

// Fonction utilitaire pour nettoyer les tests
export async function cleanupTestData() {
  console.log('🧹 Nettoyage des données de test...');
  // Cette fonction pourrait supprimer les notifications de test
  // Pour l'instant, on la laisse vide
}