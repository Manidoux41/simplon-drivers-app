import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mission, Company } from '../lib/database';
import { Colors } from '../constants/Colors';
import { DateUtils } from '../utils/dateUtils';

interface MissionCardProps {
  mission: Mission;
  company?: Company;
  onPress?: () => void;
  showStatus?: boolean;
  compact?: boolean;
}

export function MissionCard({ 
  mission, 
  company, 
  onPress, 
  showStatus = true, 
  compact = false 
}: MissionCardProps) {
  const colors = Colors.light;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return colors.warning;
      case 'IN_PROGRESS': return colors.info;
      case 'COMPLETED': return colors.success;
      case 'CANCELLED': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'IN_PROGRESS': return 'En cours';
      case 'COMPLETED': return 'Terminée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const cardStyle = compact ? styles.compactCard : styles.card;

  return (
    <TouchableOpacity
      style={[cardStyle, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {mission.title}
        </Text>
        {showStatus && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(mission.status) }]}>
            <Text style={[styles.statusText, { color: colors.textOnPrimary }]}>
              {getStatusLabel(mission.status)}
            </Text>
          </View>
        )}
      </View>

      {company && (
        <Text style={[styles.company, { color: colors.textSecondary }]} numberOfLines={1}>
          {company.name}
        </Text>
      )}

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
            {mission.departureLocation}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
            {mission.arrivalLocation}
          </Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
          Départ prévu
        </Text>
        <Text style={[styles.timeText, { color: colors.primary }]}>
          {DateUtils.formatDateTime(mission.scheduledDepartureAt)}
        </Text>
      </View>

      {!compact && (
        <View style={styles.passengersContainer}>
          <Text style={[styles.passengersText, { color: colors.textSecondary }]}>
            {mission.currentPassengers}/{mission.maxPassengers} passagers
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  company: {
    fontSize: 14,
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationRow: {
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
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  timeContainer: {
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  passengersContainer: {
    marginTop: 4,
  },
  passengersText: {
    fontSize: 12,
  },
});
