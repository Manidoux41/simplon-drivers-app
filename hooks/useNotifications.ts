import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/NotificationService';
import { authService } from '../lib/auth-local';

// Interface pour les notifications
export interface NotificationData {
  id: string;
  userId: string;
  type: 'MISSION_ASSIGNED' | 'MISSION_REMOVED' | 'MISSION_UPDATED' | 'MISSION_PENDING_CONFIRMATION' | 'MISSION_REFUSED' | 'MISSION_ACCEPTED';
  title: string;
  message: string;
  missionId: string;
  missionTitle: string;
  isRead: boolean;
  requiresAction?: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userNotifications = await notificationService.getNotificationsForUser(currentUser.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications(); // Recharger après avoir marqué comme lu
    } catch (err) {
      console.error('Erreur lors du marquage de notification:', err);
      setError('Impossible de marquer la notification comme lue');
    }
  }, [loadNotifications]);

  // Obtenir le nombre de notifications non lues
  const getUnreadCount = useCallback(async (): Promise<number> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return 0;

    try {
      return await notificationService.getUnreadCount(currentUser.id);
    } catch (err) {
      console.error('Erreur lors du comptage des notifications non lues:', err);
      return 0;
    }
  }, []);

  // Écouter les nouvelles notifications
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    // S'abonner aux notifications pour cet utilisateur
    const handleNotifications = (userNotifications: NotificationData[]) => {
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    };

    notificationService.registerListener(currentUser.id, handleNotifications);

    // Charger les notifications initiales
    loadNotifications();

    return () => {
      notificationService.unregisterListener(currentUser.id);
    };
  }, [loadNotifications]);

  // Filtres utiles
  const pendingConfirmations = notifications.filter(n => 
    n.type === 'MISSION_PENDING_CONFIRMATION' && n.requiresAction && !n.isRead
  );

  const generalNotifications = notifications.filter(n => 
    n.type !== 'MISSION_PENDING_CONFIRMATION' || !n.requiresAction
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    getUnreadCount,
    pendingConfirmations,
    generalNotifications,
  };
}