import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { databaseService, DriverWorkTime } from '../lib/database';

interface WorkTimeStatsProps {
  driverId: string;
  currentUser?: any;
}

export function WorkTimeStats({ driverId, currentUser }: WorkTimeStatsProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<DriverWorkTime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkTimeStats();
  }, [driverId, currentMonth, currentYear]);

  const loadWorkTimeStats = async () => {
    setLoading(true);
    try {
      // Charger les statistiques mensuelles
      const monthlyTotals = await databaseService.getDriverWorkTimesTotals(
        driverId,
        currentYear,
        currentMonth
      );
      setMonthlyStats(monthlyTotals);

      // Charger les statistiques quotidiennes
      const dailyTimes = await databaseService.getDriverWorkTimesByMonth(
        driverId,
        currentYear,
        currentMonth
      );
      setDailyStats(dailyTimes);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const formatMinutesToDecimal = (minutes: number): string => {
    return (minutes / 60).toFixed(1) + 'h';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  const getDayName = (year: number, month: number, day: number): string => {
    const date = new Date(year, month - 1, day);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Chargement des statistiques...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation mois */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {getMonthName(currentMonth)} {currentYear}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé mensuel */}
        <View style={styles.monthlySection}>
          <Text style={styles.sectionTitle}>Résumé du mois</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="car" size={20} color={Colors.light.primary} />
                <Text style={styles.statLabel}>Conduite</Text>
              </View>
              <Text style={styles.statValue}>
                {formatMinutesToHours(monthlyStats?.totalDrivingMinutes || 0)}
              </Text>
              <Text style={styles.statSubValue}>
                {formatMinutesToDecimal(monthlyStats?.totalDrivingMinutes || 0)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="bed" size={20} color={Colors.light.success || '#22c55e'} />
                <Text style={styles.statLabel}>Repos</Text>
              </View>
              <Text style={styles.statValue}>
                {formatMinutesToHours(monthlyStats?.totalRestMinutes || 0)}
              </Text>
              <Text style={styles.statSubValue}>
                {formatMinutesToDecimal(monthlyStats?.totalRestMinutes || 0)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="time" size={20} color={Colors.light.warning || '#f59e0b'} />
                <Text style={styles.statLabel}>Attente</Text>
              </View>
              <Text style={styles.statValue}>
                {formatMinutesToHours(monthlyStats?.totalWaitingMinutes || 0)}
              </Text>
              <Text style={styles.statSubValue}>
                {formatMinutesToDecimal(monthlyStats?.totalWaitingMinutes || 0)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="calendar" size={20} color={Colors.light.text} />
                <Text style={styles.statLabel}>Missions</Text>
              </View>
              <Text style={styles.statValue}>
                {monthlyStats?.totalMissions || 0}
              </Text>
              <Text style={styles.statSubValue}>
                {monthlyStats?.workingDays || 0} jours
              </Text>
            </View>
          </View>

          {/* Temps total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Temps total travaillé</Text>
            <Text style={styles.totalValue}>
              {formatMinutesToHours(
                (monthlyStats?.totalDrivingMinutes || 0) +
                (monthlyStats?.totalRestMinutes || 0) +
                (monthlyStats?.totalWaitingMinutes || 0)
              )}
            </Text>
          </View>
        </View>

        {/* Détail par jour */}
        <View style={styles.dailySection}>
          <Text style={styles.sectionTitle}>Détail par jour</Text>
          
          {dailyStats.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyText}>
                Aucune donnée de temps de travail pour ce mois
              </Text>
            </View>
          ) : (
            <View style={styles.dailyList}>
              {dailyStats.map((dayStats) => (
                <View key={`${dayStats.year}-${dayStats.month}-${dayStats.day}`} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayDate}>
                        {getDayName(dayStats.year, dayStats.month, dayStats.day)} {dayStats.day}
                      </Text>
                      <Text style={styles.dayMissions}>
                        {dayStats.missionCount} mission{dayStats.missionCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={styles.dayTotal}>
                      {formatMinutesToHours(
                        dayStats.totalDrivingMinutes +
                        dayStats.totalRestMinutes +
                        dayStats.totalWaitingMinutes
                      )}
                    </Text>
                  </View>
                  
                  <View style={styles.dayDetails}>
                    {dayStats.totalDrivingMinutes > 0 && (
                      <View style={styles.dayDetailItem}>
                        <Ionicons name="car" size={16} color={Colors.light.primary} />
                        <Text style={styles.dayDetailText}>
                          Conduite: {formatMinutesToHours(dayStats.totalDrivingMinutes)}
                        </Text>
                      </View>
                    )}
                    {dayStats.totalRestMinutes > 0 && (
                      <View style={styles.dayDetailItem}>
                        <Ionicons name="bed" size={16} color={Colors.light.success || '#22c55e'} />
                        <Text style={styles.dayDetailText}>
                          Repos: {formatMinutesToHours(dayStats.totalRestMinutes)}
                        </Text>
                      </View>
                    )}
                    {dayStats.totalWaitingMinutes > 0 && (
                      <View style={styles.dayDetailItem}>
                        <Ionicons name="time" size={16} color={Colors.light.warning || '#f59e0b'} />
                        <Text style={styles.dayDetailText}>
                          Attente: {formatMinutesToHours(dayStats.totalWaitingMinutes)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  monthlySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 2,
  },
  statSubValue: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  totalSection: {
    backgroundColor: Colors.light.primary + '15',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  dailySection: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  dailyList: {
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dayMissions: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  dayTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  dayDetails: {
    gap: 6,
  },
  dayDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayDetailText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
