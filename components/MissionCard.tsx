import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Colors, getMissionStatusColor } from '../constants/Colors';
import { Mission } from '../lib/types';
import { DateUtils } from '../utils/dateUtils';
import { MapUtils } from '../utils/mapUtils';

interface MissionCardProps {
  mission: Mission;
  onPress?: () => void;
  onUpdateStatus?: (status: string) => void;
  showActions?: boolean;
}

export function MissionCard({
  mission,
  onPress,
  onUpdateStatus,
  showActions = true,
}: MissionCardProps) {
  const colors = Colors.light;
  const statusColor = getMissionStatusColor(mission.status);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'COMPLETED':
        return 'Terminée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status;
    }
  };

  const distance = mission.distance 
    ? `${mission.distance} km`
    : MapUtils.calculateDistance(
        { latitude: mission.departureLat, longitude: mission.departureLng },
        { latitude: mission.arrivalLat, longitude: mission.arrivalLng }
      ) + ' km';

  const duration = mission.estimatedDuration
    ? DateUtils.formatDuration(mission.estimatedDuration)
    : 'Non estimé';

  const canStart = mission.status === 'PENDING' && DateUtils.isFuture(mission.scheduledDepartureAt);
  const canComplete = mission.status === 'IN_PROGRESS';

  return (
    <Card
      variant="elevated"
      onPress={onPress}
      pressable={!!onPress}
      style={styles.card}
    >
      <CardHeader
        title={mission.title}
        subtitle={mission.company.name}
        action={
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {getStatusText(mission.status)}
            </Text>
          </View>
        }
      />

      <CardContent>
        {/* Informations de départ */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.locationLabel, { color: colors.text }]}>
              Départ
            </Text>
          </View>
          <Text style={[styles.locationText, { color: colors.text }]}>
            {mission.departureLocation}
          </Text>
          <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
            {mission.departureAddress}
          </Text>
          <Text style={[styles.timeText, { color: colors.primary }]}>
            {DateUtils.formatDateTime(mission.scheduledDepartureAt)}
          </Text>
          {mission.actualDepartureAt && (
            <Text style={[styles.actualTimeText, { color: colors.textSecondary }]}>
              Départ réel: {DateUtils.formatDateTime(mission.actualDepartureAt)}
            </Text>
          )}
        </View>

        {/* Informations d'arrivée */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.locationLabel, { color: colors.text }]}>
              Arrivée
            </Text>
          </View>
          <Text style={[styles.locationText, { color: colors.text }]}>
            {mission.arrivalLocation}
          </Text>
          <Text style={[styles.locationAddress, { color: colors.textSecondary }]}>
            {mission.arrivalAddress}
          </Text>
          <Text style={[styles.timeText, { color: colors.accent }]}>
            {DateUtils.formatDateTime(mission.estimatedArrivalAt)}
          </Text>
          {mission.actualArrivalAt && (
            <Text style={[styles.actualTimeText, { color: colors.textSecondary }]}>
              Arrivée réelle: {DateUtils.formatDateTime(mission.actualArrivalAt)}
            </Text>
          )}
        </View>

        {/* Informations sur le trajet */}
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoItem}>
            <Text style={[styles.tripInfoLabel, { color: colors.textSecondary }]}>
              Distance
            </Text>
            <Text style={[styles.tripInfoValue, { color: colors.text }]}>
              {distance}
            </Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Text style={[styles.tripInfoLabel, { color: colors.textSecondary }]}>
              Durée estimée
            </Text>
            <Text style={[styles.tripInfoValue, { color: colors.text }]}>
              {duration}
            </Text>
          </View>
          <View style={styles.tripInfoItem}>
            <Text style={[styles.tripInfoLabel, { color: colors.textSecondary }]}>
              Passagers
            </Text>
            <Text style={[styles.tripInfoValue, { color: colors.text }]}>
              {mission.currentPassengers}/{mission.maxPassengers}
            </Text>
          </View>
        </View>

        {mission.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
              Description
            </Text>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {mission.description}
            </Text>
          </View>
        )}
      </CardContent>

      {showActions && (canStart || canComplete) && (
        <CardFooter>
          <View style={styles.actions}>
            {canStart && (
              <Button
                title="Commencer"
                onPress={() => onUpdateStatus?.('IN_PROGRESS')}
                variant="primary"
                style={styles.actionButton}
              />
            )}
            {canComplete && (
              <Button
                title="Terminer"
                onPress={() => onUpdateStatus?.('COMPLETED')}
                variant="secondary"
                style={styles.actionButton}
              />
            )}
          </View>
        </CardFooter>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  locationSection: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    marginLeft: 16,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 16,
  },
  actualTimeText: {
    fontSize: 12,
    marginLeft: 16,
    marginTop: 2,
    fontStyle: 'italic',
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    marginVertical: 8,
  },
  tripInfoItem: {
    alignItems: 'center',
  },
  tripInfoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  tripInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
