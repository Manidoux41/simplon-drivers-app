import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Mission, databaseService } from '../lib/database';
import { 
  KilometrageActions,
  KilometrageSummary,
} from '../components';

export default function MissionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(false);
  const colors = Colors.light;

  useEffect(() => {
    if (id) {
      loadMission();
    }
  }, [id]);

  const loadMission = async () => {
    try {
      setLoading(true);
      // Récupérer la mission depuis la base de données
      // const missionData = await databaseService.getMissionById(id as string);
      // setMission(missionData);
      
      // Pour l'exemple, créons une mission factice
      const fakeMission: Mission = {
        id: id as string,
        title: 'Livraison urgente Paris - Lyon',
        description: 'Transport de matériel médical urgent',
        status: 'IN_PROGRESS',
        departureLocation: 'Dépôt Paris',
        departureAddress: '123 Rue de la Paix, 75001 Paris',
        departureLat: 48.8566,
        departureLng: 2.3522,
        scheduledDepartureAt: new Date().toISOString(),
        arrivalLocation: 'Hôpital de Lyon',
        arrivalAddress: '456 Avenue de la République, 69003 Lyon',
        arrivalLat: 45.7640,
        arrivalLng: 4.8357,
        estimatedArrivalAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // +4h
        maxPassengers: 50,
        currentPassengers: 0,
        driverId: 'driver-1',
        companyId: 'company-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Quelques données de kilométrage pour tester
        kmDepotStart: 125000,
        kmMissionStart: 125025,
        // kmMissionEnd et kmDepotEnd non définies pour tester l'état partiel
      };
      setMission(fakeMission);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la mission');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleMissionUpdate = async (missionId: string) => {
    // Recharger la mission après mise à jour du kilométrage
    await loadMission();
  };

  if (!mission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Chargement...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadMission} />
      }
    >
      {/* En-tête de la mission */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {mission.title}
        </Text>
        {mission.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {mission.description}
          </Text>
        )}
        <View style={styles.clientInfo}>
          <Text style={[styles.clientLabel, { color: colors.textSecondary }]}>
            Destination:
          </Text>
          <Text style={[styles.clientName, { color: colors.text }]}>
            {mission.arrivalLocation}
          </Text>
        </View>
      </View>

      {/* Actions de kilométrage */}
      <KilometrageActions
        mission={mission}
        onUpdate={handleMissionUpdate}
        showSummary={true}
      />

      {/* Résumé détaillé du kilométrage */}
      <KilometrageSummary
        mission={mission}
        showEditButton={true}
        onEdit={() => {
          // Cette fonction sera appelée quand l'utilisateur clique sur "Modifier"
          Alert.alert('Modification', 'Fonctionnalité de modification en cours de développement');
        }}
      />

      {/* Actions PDF - temporairement commentées */}
      {/* <MissionPdfActions mission={mission} /> */}

      {/* Informations de la mission */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Détails de la mission
        </Text>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Adresse de départ:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {mission.departureAddress}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Adresse d'arrivée:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {mission.arrivalAddress}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Départ prévu:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {new Date(mission.scheduledDepartureAt).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 22,
  },
});
