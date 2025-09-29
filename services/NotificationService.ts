import { Alert } from 'react-native';
import { databaseService, Mission, User } from '../lib/database';
import { missionEventBus } from './MissionEventBus';

interface NotificationData {
  id: string;
  userId: string;
  type: 'MISSION_ASSIGNED' | 'MISSION_REMOVED' | 'MISSION_UPDATED' | 'MISSION_PENDING_CONFIRMATION' | 'MISSION_REFUSED' | 'MISSION_ACCEPTED';
  title: string;
  message: string;
  missionId: string;
  missionTitle: string;
  isRead: boolean;
  createdAt: string;
  requiresAction?: boolean; // Pour les notifications qui nécessitent une action
}

class NotificationService {
  private static instance: NotificationService;
  private listeners: Map<string, (notifications: NotificationData[]) => void> = new Map();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Enregistrer un listener pour un utilisateur
  registerListener(userId: string, callback: (notifications: NotificationData[]) => void) {
    this.listeners.set(userId, callback);
  }

  // Désinscrire un listener
  unregisterListener(userId: string) {
    this.listeners.delete(userId);
  }

  // Créer une notification de mission attribuée
  async notifyMissionAssigned(driverId: string, mission: Mission) {
    try {
      const driver = await databaseService.getUserById(driverId);
      if (!driver) return;

      const notification: Omit<NotificationData, 'id'> = {
        userId: driverId,
        type: 'MISSION_ASSIGNED',
        title: 'Nouvelle mission attribuée',
        message: `La mission "${mission.title}" vous a été attribuée pour le ${new Date(mission.scheduledDepartureAt).toLocaleDateString('fr-FR')}.`,
        missionId: mission.id,
        missionTitle: mission.title,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      // Stocker la notification (vous pouvez l'adapter selon votre système de stockage)
      await this.storeNotification(notification);

      // Afficher une alerte immédiate si l'utilisateur est connecté
      this.showImmediateNotification(driver, notification);

      // Notifier les listeners
      const callback = this.listeners.get(driverId);
      if (callback) {
        const notifications = await this.getNotificationsForUser(driverId);
        callback(notifications);
      }

      // Notifier le système global que les missions ont changé
      missionEventBus.notify();

      console.log(`📢 Notification envoyée: Mission "${mission.title}" attribuée à ${driver.firstName} ${driver.lastName}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
    }
  }

  // Créer une notification de mission retirée
  async notifyMissionRemoved(previousDriverId: string, mission: Mission) {
    try {
      const driver = await databaseService.getUserById(previousDriverId);
      if (!driver) return;

      const notification: Omit<NotificationData, 'id'> = {
        userId: previousDriverId,
        type: 'MISSION_REMOVED',
        title: 'Mission retirée',
        message: `La mission "${mission.title}" ne vous est plus attribuée.`,
        missionId: mission.id,
        missionTitle: mission.title,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await this.storeNotification(notification);
      this.showImmediateNotification(driver, notification);

      const callback = this.listeners.get(previousDriverId);
      if (callback) {
        const notifications = await this.getNotificationsForUser(previousDriverId);
        callback(notifications);
      }

      // Notifier le système global que les missions ont changé
      missionEventBus.notify();

      console.log(`📢 Notification envoyée: Mission "${mission.title}" retirée de ${driver.firstName} ${driver.lastName}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
    }
  }

  // Créer une notification de mission mise à jour
  async notifyMissionUpdated(driverId: string, mission: Mission, changes: string[]) {
    try {
      const driver = await databaseService.getUserById(driverId);
      if (!driver) return;

      const changesText = changes.join(', ');
      const notification: Omit<NotificationData, 'id'> = {
        userId: driverId,
        type: 'MISSION_UPDATED',
        title: 'Mission mise à jour',
        message: `La mission "${mission.title}" a été modifiée: ${changesText}.`,
        missionId: mission.id,
        missionTitle: mission.title,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await this.storeNotification(notification);
      this.showImmediateNotification(driver, notification);

      const callback = this.listeners.get(driverId);
      if (callback) {
        const notifications = await this.getNotificationsForUser(driverId);
        callback(notifications);
      }

      // Notifier le système global que les missions ont changé
      missionEventBus.notify();

      console.log(`📢 Notification envoyée: Mission "${mission.title}" mise à jour pour ${driver.firstName} ${driver.lastName}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
    }
  }

  // Demander confirmation d'assignation de mission à un chauffeur
  async notifyMissionPendingConfirmation(driverId: string, mission: Mission) {
    try {
      const driver = await databaseService.getUserById(driverId);
      if (!driver) {
        console.error('Driver not found:', driverId);
        return;
      }

      const notification: Omit<NotificationData, 'id'> = {
        userId: driverId,
        type: 'MISSION_PENDING_CONFIRMATION',
        title: 'Nouvelle mission proposée',
        message: `Une mission "${mission.title}" vous est proposée. Souhaitez-vous l'accepter ?`,
        missionId: mission.id,
        missionTitle: mission.title,
        isRead: false,
        requiresAction: true,
        createdAt: new Date().toISOString()
      };

      await this.storeNotification(notification);
      // Ne pas afficher la popup pour les confirmations car c'est géré par MissionConfirmationCard
      // this.showConfirmationNotification(driver, notification, mission);

      const callback = this.listeners.get(driverId);
      if (callback) {
        const notifications = await this.getNotificationsForUser(driverId);
        callback(notifications);
      }

      console.log(`🔔 Demande de confirmation envoyée: Mission "${mission.title}" à ${driver.firstName} ${driver.lastName}`);
      console.log(`🔔 Driver ID: ${driverId}, Notification stockée avec ID:`, notification);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de demande de confirmation:', error);
    }
  }

  // Notifier les administrateurs qu'une mission a été refusée
  async notifyMissionRefused(mission: Mission, driverName: string) {
    try {
      // Récupérer tous les administrateurs
      const admins = await databaseService.getAdminUsers();
      
      for (const admin of admins) {
        const notification: Omit<NotificationData, 'id'> = {
          userId: admin.id,
          type: 'MISSION_REFUSED',
          title: 'Mission refusée',
          message: `${driverName} a refusé la mission "${mission.title}". La mission n'a plus de chauffeur assigné.`,
          missionId: mission.id,
          missionTitle: mission.title,
          isRead: false,
          createdAt: new Date().toISOString()
        };

        await this.storeNotification(notification);
        this.showImmediateNotification(admin, notification);

        const callback = this.listeners.get(admin.id);
        if (callback) {
          const notifications = await this.getNotificationsForUser(admin.id);
          callback(notifications);
        }
      }

      console.log(`❌ Notification de refus envoyée aux administrateurs: Mission "${mission.title}" refusée par ${driverName}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification de refus:', error);
    }
  }

  // Confirmer l'acceptation d'une mission
  async notifyMissionAccepted(driverId: string, mission: Mission) {
    try {
      const driver = await databaseService.getUserById(driverId);
      if (!driver) {
        console.error('Driver not found:', driverId);
        return;
      }

      const notification: Omit<NotificationData, 'id'> = {
        userId: driverId,
        type: 'MISSION_ACCEPTED',
        title: 'Mission acceptée',
        message: `Vous avez accepté la mission "${mission.title}". Elle est maintenant assignée.`,
        missionId: mission.id,
        missionTitle: mission.title,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      await this.storeNotification(notification);
      this.showImmediateNotification(driver, notification);

      const callback = this.listeners.get(driverId);
      if (callback) {
        const notifications = await this.getNotificationsForUser(driverId);
        callback(notifications);
      }

      // Notifier le système global que les missions ont changé
      missionEventBus.notify();

      console.log(`✅ Mission acceptée: "${mission.title}" par ${driver.firstName} ${driver.lastName}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de confirmation d\'acceptation:', error);
    }
  }

  // Note: Les actions de confirmation/refus sont maintenant gérées par MissionConfirmationCard

  // Afficher une notification immédiate (popup)
  private showImmediateNotification(user: User, notification: Omit<NotificationData, 'id'>) {
    const emoji = notification.type === 'MISSION_ASSIGNED' ? '🚗' : 
                  notification.type === 'MISSION_REMOVED' ? '❌' : 
                  notification.type === 'MISSION_UPDATED' ? '🔄' :
                  notification.type === 'MISSION_ACCEPTED' ? '✅' :
                  notification.type === 'MISSION_REFUSED' ? '❌' :
                  notification.type === 'MISSION_PENDING_CONFIRMATION' ? '🔔' : '📱';
    
    Alert.alert(
      `${emoji} ${notification.title}`,
      `Bonjour ${user.firstName},\n\n${notification.message}`,
      [
        { 
          text: 'OK', 
          onPress: () => console.log('Notification acknowledged') 
        }
      ]
    );
  }

  // Stocker la notification dans la base de données
  private async storeNotification(notification: Omit<NotificationData, 'id'>) {
    try {
      const id = await databaseService.storeNotification(notification);
      console.log('💾 Notification stockée:', id);
      return id;
    } catch (error) {
      console.error('Erreur lors du stockage de notification:', error);
    }
  }

  // Récupérer les notifications pour un utilisateur
  async getNotificationsForUser(userId: string): Promise<NotificationData[]> {
    try {
      return await databaseService.getNotificationsForUser(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string) {
    try {
      await databaseService.markNotificationAsRead(notificationId);
      console.log('✅ Notification marquée comme lue:', notificationId);
    } catch (error) {
      console.error('Erreur lors du marquage de notification:', error);
    }
  }

  // Obtenir le nombre de notifications non lues
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await databaseService.getUnreadNotificationCount(userId);
    } catch (error) {
      console.error('Erreur lors du comptage des notifications non lues:', error);
      return 0;
    }
  }

  // Analyser les changements entre deux missions
  detectMissionChanges(originalMission: Mission, updatedMission: Partial<Mission>): string[] {
    const changes: string[] = [];

    if (updatedMission.title && updatedMission.title !== originalMission.title) {
      changes.push('titre');
    }
    if (updatedMission.scheduledDepartureAt && updatedMission.scheduledDepartureAt !== originalMission.scheduledDepartureAt) {
      changes.push('horaire');
    }
    if (updatedMission.departureAddress && updatedMission.departureAddress !== originalMission.departureAddress) {
      changes.push('lieu de départ');
    }
    if (updatedMission.arrivalAddress && updatedMission.arrivalAddress !== originalMission.arrivalAddress) {
      changes.push('destination');
    }
    if (updatedMission.maxPassengers && updatedMission.maxPassengers !== originalMission.maxPassengers) {
      changes.push('nombre de passagers');
    }

    return changes;
  }
}

export const notificationService = NotificationService.getInstance();
export type { NotificationData };