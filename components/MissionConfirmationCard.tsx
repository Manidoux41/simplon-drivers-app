import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { notificationService } from '../services/NotificationService';
import { databaseService, Mission } from '../lib/database';

interface MissionConfirmationCardProps {
  notification: {
    id: string;
    userId: string;
    type: 'MISSION_PENDING_CONFIRMATION';
    title: string;
    message: string;
    missionId: string;
    missionTitle: string;
    isRead: boolean;
    requiresAction?: boolean;
    createdAt: string;
  };
  onConfirmed: () => void;
  userFirstName: string;
}

export const MissionConfirmationCard: React.FC<MissionConfirmationCardProps> = ({
  notification,
  onConfirmed,
  userFirstName
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [mission, setMission] = React.useState<Mission | null>(null);

  React.useEffect(() => {
    loadMissionDetails();
  }, [notification.missionId]);

  const loadMissionDetails = async () => {
    try {
      const missionData = await databaseService.getMissionById(notification.missionId);
      setMission(missionData);
    } catch (error) {
      console.error('Erreur lors du chargement des détails de mission:', error);
    }
  };

  const handleAccept = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (!mission) {
        Alert.alert('Erreur', 'Mission non trouvée');
        return;
      }

      console.log('🔄 Acceptation de mission:', {
        missionId: mission.id,
        userId: notification.userId,
        currentDriverId: mission.driverId,
        currentStatus: mission.status
      });

      // Utiliser l'ID de la notification pour être sûr
      const missionIdToUpdate = notification.missionId;
      
      // Vérifier que la mission existe avant de la mettre à jour
      const missionToUpdate = await databaseService.getMissionById(missionIdToUpdate);
      if (!missionToUpdate) {
        throw new Error(`Mission ${missionIdToUpdate} introuvable`);
      }
      
      console.log('🔍 Mission trouvée:', {
        id: missionToUpdate.id,
        title: missionToUpdate.title,
        currentStatus: missionToUpdate.status,
        currentDriverId: missionToUpdate.driverId
      });
      
      // Confirmer l'assignation (sans déclencher les notifications automatiques)
      // Accepter la mission - changer le statut à ASSIGNED et attribuer le chauffeur
      await databaseService.updateMission(mission.id, {
        status: 'ASSIGNED',
        driverId: notification.userId
      }, true); // skipNotifications = true pour éviter les notifications en boucle

      console.log('✅ Mission mise à jour avec succès');

      // Marquer la notification comme lue
      await notificationService.markAsRead(notification.id);

      // Envoyer notification d'acceptation
      await notificationService.notifyMissionAccepted(notification.userId, mission);

      Alert.alert(
        '✅ Mission acceptée',
        `Vous avez accepté la mission "${mission.title}". Elle apparaît maintenant dans votre onglet Missions.`,
        [{ text: 'OK', onPress: onConfirmed }]
      );
    } catch (error) {
      console.error('❌ Erreur lors de l\'acceptation:', error);
      
      let errorMessage = 'Impossible d\'accepter la mission';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Détails de l\'erreur:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      
      Alert.alert('Erreur', `Erreur: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (isProcessing) return;

    Alert.alert(
      '❌ Refuser la mission',
      'Êtes-vous sûr de vouloir refuser cette mission ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              if (!mission) {
                Alert.alert('Erreur', 'Mission non trouvée');
                return;
              }

              // Remettre la mission en statut non assigné (sans déclencher les notifications automatiques)
              await databaseService.updateMission(mission.id, { 
                driverId: undefined, // Retirer le chauffeur
                status: 'PENDING'
              }, true); // true = skipNotifications

              // Marquer la notification comme lue
              await notificationService.markAsRead(notification.id);

              // Notifier les administrateurs
              await notificationService.notifyMissionRefused(mission, userFirstName);

              Alert.alert(
                '❌ Mission refusée',
                'La mission a été refusée et les administrateurs ont été notifiés.',
                [{ text: 'OK', onPress: onConfirmed }]
              );
            } catch (error) {
              console.error('Erreur lors du refus:', error);
              Alert.alert('Erreur', 'Impossible de refuser la mission');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (!mission) {
    return (
      <View style={styles.card}>
        <Text style={styles.loading}>Chargement des détails...</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>🚗 {notification.title}</Text>
        <Text style={styles.date}>
          {new Date(notification.createdAt).toLocaleString()}
        </Text>
      </View>
      
      <Text style={styles.message}>{notification.message}</Text>
      
      <View style={styles.missionDetails}>
        <Text style={styles.detailLabel}>Mission:</Text>
        <Text style={styles.detailValue}>{mission.title}</Text>
        
        <Text style={styles.detailLabel}>Départ:</Text>
        <Text style={styles.detailValue}>{mission.departureLocation}</Text>
        
        <Text style={styles.detailLabel}>Arrivée:</Text>
        <Text style={styles.detailValue}>{mission.arrivalLocation}</Text>
        
        <Text style={styles.detailLabel}>Heure prévue:</Text>
        <Text style={styles.detailValue}>
          {new Date(mission.scheduledDepartureAt).toLocaleString()}
        </Text>

        <Text style={styles.detailLabel}>Passagers:</Text>
        <Text style={styles.detailValue}>
          {mission.currentPassengers}/{mission.maxPassengers}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.refuseButton]}
          onPress={handleRefuse}
          disabled={isProcessing}
        >
          <Text style={styles.refuseButtonText}>
            {isProcessing ? 'Traitement...' : 'Refuser'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={handleAccept}
          disabled={isProcessing}
        >
          <Text style={styles.acceptButtonText}>
            {isProcessing ? 'Traitement...' : 'Accepter'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  message: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    lineHeight: 20,
  },
  missionDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refuseButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  refuseButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loading: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});