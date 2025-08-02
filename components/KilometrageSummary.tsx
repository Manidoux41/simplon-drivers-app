import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Mission } from '../lib/database';

interface KilometrageSummaryProps {
  mission: Mission;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function KilometrageSummary({ 
  mission, 
  onEdit, 
  showEditButton = false 
}: KilometrageSummaryProps) {
  const colors = Colors.light;
  
  const hasKilometrageData = 
    mission.kmDepotStart !== undefined || 
    mission.kmMissionStart !== undefined ||
    mission.kmMissionEnd !== undefined ||
    mission.kmDepotEnd !== undefined;

  const isComplete = 
    mission.kmDepotStart !== undefined &&
    mission.kmMissionStart !== undefined &&
    mission.kmMissionEnd !== undefined &&
    mission.kmDepotEnd !== undefined;

  if (!hasKilometrageData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="speedometer" size={20} color={colors.textSecondary} />
            <Text style={[styles.title, { color: colors.textSecondary }]}>
              Kilométrage
            </Text>
          </View>
          {showEditButton && onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.editButton}>
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={[styles.editText, { color: colors.primary }]}>
                Ajouter
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.noData, { color: colors.textSecondary }]}>
          Aucun kilométrage enregistré
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons 
            name="speedometer" 
            size={20} 
            color={isComplete ? colors.success : colors.warning} 
          />
          <Text style={[styles.title, { color: colors.text }]}>
            Kilométrage
          </Text>
          {isComplete && (
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Text style={[styles.badgeText, { color: colors.textOnPrimary }]}>
                Complet
              </Text>
            </View>
          )}
        </View>
        {showEditButton && onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={[styles.editText, { color: colors.primary }]}>
              Modifier
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Kilométrages individuels */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Relevés
          </Text>
          
          <View style={styles.readings}>
            <View style={styles.reading}>
              <View style={styles.readingIcon}>
                <Ionicons name="business" size={16} color={colors.primary} />
              </View>
              <View style={styles.readingContent}>
                <Text style={[styles.readingLabel, { color: colors.textSecondary }]}>
                  Départ dépôt
                </Text>
                <Text style={[styles.readingValue, { color: colors.text }]}>
                  {mission.kmDepotStart !== undefined 
                    ? `${mission.kmDepotStart.toLocaleString()} km`
                    : '---'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.reading}>
              <View style={styles.readingIcon}>
                <Ionicons name="location" size={16} color={colors.success} />
              </View>
              <View style={styles.readingContent}>
                <Text style={[styles.readingLabel, { color: colors.textSecondary }]}>
                  Début mission
                </Text>
                <Text style={[styles.readingValue, { color: colors.text }]}>
                  {mission.kmMissionStart !== undefined 
                    ? `${mission.kmMissionStart.toLocaleString()} km`
                    : '---'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.reading}>
              <View style={styles.readingIcon}>
                <Ionicons name="flag" size={16} color={colors.error} />
              </View>
              <View style={styles.readingContent}>
                <Text style={[styles.readingLabel, { color: colors.textSecondary }]}>
                  Fin mission
                </Text>
                <Text style={[styles.readingValue, { color: colors.text }]}>
                  {mission.kmMissionEnd !== undefined 
                    ? `${mission.kmMissionEnd.toLocaleString()} km`
                    : '---'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.reading}>
              <View style={styles.readingIcon}>
                <Ionicons name="business" size={16} color={colors.primary} />
              </View>
              <View style={styles.readingContent}>
                <Text style={[styles.readingLabel, { color: colors.textSecondary }]}>
                  Retour dépôt
                </Text>
                <Text style={[styles.readingValue, { color: colors.text }]}>
                  {mission.kmDepotEnd !== undefined 
                    ? `${mission.kmDepotEnd.toLocaleString()} km`
                    : '---'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Distances calculées */}
        {(mission.distanceMissionOnly !== undefined || mission.distanceDepotToDepot !== undefined) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Distances calculées
            </Text>
            
            <View style={styles.distances}>
              {mission.distanceMissionOnly !== undefined && (
                <View style={[styles.distance, { backgroundColor: colors.background }]}>
                  <View style={styles.distanceHeader}>
                    <Ionicons name="navigate" size={18} color={colors.success} />
                    <Text style={[styles.distanceLabel, { color: colors.text }]}>
                      Distance mission uniquement
                    </Text>
                  </View>
                  <Text style={[styles.distanceValue, { color: colors.success }]}>
                    {mission.distanceMissionOnly.toLocaleString()} km
                  </Text>
                </View>
              )}

              {mission.distanceDepotToDepot !== undefined && (
                <View style={[styles.distance, { backgroundColor: colors.background }]}>
                  <View style={styles.distanceHeader}>
                    <Ionicons name="swap-horizontal" size={18} color={colors.info} />
                    <Text style={[styles.distanceLabel, { color: colors.text }]}>
                      Distance totale (dépôt à dépôt)
                    </Text>
                  </View>
                  <Text style={[styles.distanceValue, { color: colors.info }]}>
                    {mission.distanceDepotToDepot.toLocaleString()} km
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  noData: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  content: {
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readings: {
    gap: 8,
  },
  reading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  readingIcon: {
    width: 24,
    alignItems: 'center',
  },
  readingContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  readingLabel: {
    fontSize: 14,
  },
  readingValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  distances: {
    gap: 8,
  },
  distance: {
    padding: 12,
    borderRadius: 8,
  },
  distanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceLabel: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});
