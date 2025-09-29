/**
 * Script de test pour vérifier le système de notifications
 * Ce script simule l'assignation d'une mission à un chauffeur
 */

import { notificationService } from '../services/NotificationService';
import { missionEventBus } from '../services/MissionEventBus';

// Test du système de notifications
export async function testNotificationSystem() {
  console.log('🔔 Test du système de notifications...');
  
  try {
    // Simulation d'une mission
    const testMission = {
      id: 'test-mission-123',
      title: 'Mission de test',
      client: 'Client Test',
      driver_id: 'driver-456',
      driver_name: 'Jean Dupont',
      status: 'assigned' as const,
      date: new Date().toISOString().split('T')[0],
      pickup_address: '123 Rue de Test',
      dropoff_address: '456 Avenue de Test'
    };

    const oldDriverId = 'old-driver-789';
    const oldDriverName = 'Marie Martin';

    // Test 1: Notification d'assignation
    console.log('📱 Test 1: Assignation de mission');
    await notificationService.notifyMissionAssigned(testMission.driver_id, testMission);
    
    // Test 2: Notification de suppression
    console.log('📱 Test 2: Suppression de mission');
    await notificationService.notifyMissionRemoved(oldDriverId, testMission);
    
    // Test 3: Vérification de l'event bus
    console.log('📡 Test 3: Event Bus');
    const eventBus = missionEventBus;
    
    eventBus.subscribe(() => {
      console.log('🔄 Événement de mission reçu');
    });
    
    eventBus.notify();

    console.log('✅ Tests réussis !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Fonction utilitaire pour compter les notifications en attente
export async function getNotificationCount(userId: string): Promise<number> {
  try {
    const notifications = await notificationService.getNotificationsForUser(userId);
    return notifications.length;
  } catch (error) {
    console.error('Erreur lors du comptage des notifications:', error);
    return 0;
  }
}

// Test rapide des notifications
export function quickNotificationTest() {
  console.log('🚀 Test rapide des notifications...');
  
  // Simuler une notification simple
  const testNotification = {
    id: `test-${Date.now()}`,
    title: 'Mission assignée',
    message: 'Une nouvelle mission vous a été assignée',
    type: 'mission_assigned' as const,
    timestamp: Date.now(),
    read: false
  };

  console.log('📝 Notification de test créée:', testNotification);
  
  // Dans un vrai environnement, ceci serait sauvegardé en base
  return testNotification;
}