import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { notificationService, NotificationData } from '../services/NotificationService';
import { authService } from '../lib/auth-local';
import { MissionConfirmationCard } from './MissionConfirmationCard';

interface NotificationBellProps {
  style?: any;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ style }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    // S'abonner aux notifications pour cet utilisateur
    const handleNotifications = (userNotifications: NotificationData[]) => {
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    };

    notificationService.registerListener(currentUser.id, handleNotifications);

    // Charger les notifications existantes
    loadNotifications();

    return () => {
      notificationService.unregisterListener(currentUser.id);
    };
  }, []);

  const loadNotifications = async () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    try {
      const userNotifications = await notificationService.getNotificationsForUser(currentUser.id);
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const handleNotificationPress = async (notification: NotificationData) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MISSION_ASSIGNED':
        return 'car-outline';
      case 'MISSION_REMOVED':
        return 'close-circle-outline';
      case 'MISSION_UPDATED':
        return 'refresh-outline';
      case 'MISSION_PENDING_CONFIRMATION':
        return 'help-circle-outline';
      case 'MISSION_ACCEPTED':
        return 'checkmark-circle-outline';
      case 'MISSION_REFUSED':
        return 'close-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'MISSION_ASSIGNED':
        return Colors.light.success;
      case 'MISSION_REMOVED':
        return Colors.light.error;
      case 'MISSION_UPDATED':
        return Colors.light.info;
      case 'MISSION_PENDING_CONFIRMATION':
        return '#FF9500'; // Orange pour les demandes de confirmation
      case 'MISSION_ACCEPTED':
        return Colors.light.success;
      case 'MISSION_REFUSED':
        return Colors.light.error;
      default:
        return Colors.light.text;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.bellContainer, style]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons 
          name="notifications" 
          size={24} 
          color={Colors.light.text} 
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.notificationsList}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="notifications-off-outline" 
                  size={48} 
                  color={Colors.light.textSecondary} 
                />
                <Text style={styles.emptyText}>Aucune notification</Text>
              </View>
            ) : (
              notifications.map((notification) => {
                // Si c'est une notification qui nécessite une confirmation ET qui n'a pas encore été traitée
                if (notification.type === 'MISSION_PENDING_CONFIRMATION' && notification.requiresAction && !notification.isRead) {
                  const currentUser = authService.getCurrentUser();
                  if (!currentUser) return null;
                  
                  return (
                    <MissionConfirmationCard
                      key={notification.id}
                      notification={notification as any}
                      onConfirmed={() => {
                        loadNotifications(); // Recharger les notifications après action
                      }}
                      userFirstName={currentUser.firstName}
                    />
                  );
                }

                // Notification normale
                return (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.isRead && styles.unreadNotification
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationIcon}>
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={24}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={[
                          styles.notificationTitle,
                          !notification.isRead && styles.unreadTitle
                        ]}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationDate}>
                          {formatDate(notification.createdAt)}
                        </Text>
                      </View>
                      
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      
                      <Text style={styles.missionTitle}>
                        Mission: {notification.missionTitle}
                      </Text>
                    </View>

                    {!notification.isRead && (
                      <View style={styles.unreadDot} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  notificationsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: 'white',
  },
  unreadNotification: {
    backgroundColor: '#f8fafc',
  },
  notificationIcon: {
    marginRight: 12,
    paddingTop: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  missionTitle: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginLeft: 8,
    marginTop: 8,
  },
});