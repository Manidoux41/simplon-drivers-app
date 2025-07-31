import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth-local';
import { useMissions } from '../../hooks/useMissions-local';
import { useVehicles } from '../../hooks/useVehicles';
import { useDriversWithNotification } from '../../hooks/useDrivers';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Logo } from '../../components/ui/Logo';
import { Colors } from '../../constants/Colors';
import { databaseService } from '../../lib/database';

export default function AdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { missions, companies, loading, loadMissions } = useMissions();
  const { activeVehicles, loading: vehiclesLoading } = useVehicles();
  const { drivers, loading: driversLoading, error: driversError } = useDriversWithNotification();
  const [createLoading, setCreateLoading] = useState(false);
  const colors = Colors.light;

  // États pour le formulaire de création de mission
  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    departureLocation: '',
    departureAddress: '',
    arrivalLocation: '',
    arrivalAddress: '',
    scheduledDepartureAt: '',
    estimatedArrivalAt: '',
    maxPassengers: '4',
    companyId: '',
    driverId: '',
    vehicleId: '',
  });

  const handleResetDatabase = async () => {
    Alert.alert(
      'Réinitialiser la base de données',
      'Cette action va supprimer toutes les données et les recréer. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.resetDatabase();
              Alert.alert('Succès', 'Base de données réinitialisée avec succès');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Erreur inconnue';
              Alert.alert('Erreur', 'Impossible de réinitialiser la base de données: ' + message);
            }
          }
        }
      ]
    );
  };

  const handleDebugUsers = async () => {
    try {
      await databaseService.debugUsers();
      Alert.alert('Debug', 'Vérifiez les logs de la console pour voir les informations des utilisateurs');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', 'Impossible de déboguer les utilisateurs: ' + message);
    }
  };

  useEffect(() => {
    // Plus besoin de loadDrivers car géré par le hook useDriversWithNotification
  }, []);

  // Vérification des droits d'admin - APRÈS tous les hooks
  if (user?.role !== 'ADMIN') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Accès non autorisé. Cette section est réservée aux administrateurs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCreateMission = async () => {
    // Validation basique
    if (!missionForm.title || !missionForm.departureLocation || !missionForm.arrivalLocation || !missionForm.driverId || !missionForm.companyId) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setCreateLoading(true);

      // Générer des coordonnées par défaut (à remplacer par un vrai service de géocodage)
      const departureCoords = { lat: 48.8566, lng: 2.3522 }; // Paris par défaut
      const arrivalCoords = { lat: 48.8606, lng: 2.3376 }; // Paris par défaut

      const newMission = {
        id: `mission_${Date.now()}`,
        title: missionForm.title,
        description: missionForm.description,
        status: 'PENDING' as const,
        departureLocation: missionForm.departureLocation,
        departureAddress: missionForm.departureAddress || missionForm.departureLocation,
        departureLat: departureCoords.lat,
        departureLng: departureCoords.lng,
        scheduledDepartureAt: missionForm.scheduledDepartureAt || new Date().toISOString(),
        arrivalLocation: missionForm.arrivalLocation,
        arrivalAddress: missionForm.arrivalAddress || missionForm.arrivalLocation,
        arrivalLat: arrivalCoords.lat,
        arrivalLng: arrivalCoords.lng,
        estimatedArrivalAt: missionForm.estimatedArrivalAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        distance: 10, // Distance par défaut
        estimatedDuration: 60, // 1 heure par défaut
        maxPassengers: parseInt(missionForm.maxPassengers) || 4,
        currentPassengers: 0,
        driverId: missionForm.driverId,
        companyId: missionForm.companyId,
        vehicleId: missionForm.vehicleId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await databaseService.createMission(newMission);
      await loadMissions();

      // Réinitialiser le formulaire
      setMissionForm({
        title: '',
        description: '',
        departureLocation: '',
        departureAddress: '',
        arrivalLocation: '',
        arrivalAddress: '',
        scheduledDepartureAt: '',
        estimatedArrivalAt: '',
        maxPassengers: '4',
        companyId: '',
        driverId: '',
        vehicleId: '',
      });

      Alert.alert('Succès', 'Mission créée avec succès !');
    } catch (error) {
      console.error('Erreur création mission:', error);
      Alert.alert('Erreur', 'Impossible de créer la mission');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading || driversLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner text="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Logo size="medium" showText={false} style={styles.headerLogo} />
          <Text style={[styles.title, { color: colors.text }]}>
            Administration
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gestion des missions et des chauffeurs
          </Text>
        </View>

        {/* Navigation rapide */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Actions rapides" />
          <CardContent>
            <View style={styles.quickActions}>
              <Button
                title="Gérer les utilisateurs"
                onPress={() => router.push('/admin/users')}
                style={styles.quickActionButton}
                variant="outline"
              />
              <Button
                title="Voir toutes les missions"
                onPress={() => router.push('/admin/all-missions')}
                style={styles.quickActionButton}
                variant="outline"
              />
              <Button
                title="🔄 Reset DB (Debug)"
                onPress={handleResetDatabase}
                style={styles.quickActionButton}
                variant="secondary"
              />
              <Button
                title="🔍 Debug Users"
                onPress={handleDebugUsers}
                style={styles.quickActionButton}
                variant="ghost"
              />
            </View>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Actions rapides" />
          <CardContent>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => router.push('/admin/vehicles')}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="car" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Gestion Flotte
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickActionItem}
                onPress={() => router.push('/admin/create-mission' as any)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="add-circle" size={24} color={colors.success} />
                </View>
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  Nouvelle Mission
                </Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        {/* Statistiques rapides */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Statistiques" />
          <CardContent>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {drivers.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Chauffeurs
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {missions.filter(m => m.status === 'PENDING').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  En attente
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.info }]}>
                  {missions.filter(m => m.status === 'IN_PROGRESS').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  En cours
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.secondary }]}>
                  {activeVehicles.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Véhicules actifs
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Formulaire de création de mission */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Créer une nouvelle mission" />
          <CardContent>
            <View style={styles.inputWrapper}>
              <Input
                label="Titre de la mission *"
                value={missionForm.title}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, title: text }))}
                placeholder="Ex: Transport Mairie de Paris"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Description"
                value={missionForm.description}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, description: text }))}
                placeholder="Description détaillée de la mission"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Lieu de départ *"
                value={missionForm.departureLocation}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, departureLocation: text }))}
                placeholder="Ex: Aéroport Charles de Gaulle"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Adresse de départ"
                value={missionForm.departureAddress}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, departureAddress: text }))}
                placeholder="Adresse complète"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Lieu d'arrivée *"
                value={missionForm.arrivalLocation}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, arrivalLocation: text }))}
                placeholder="Ex: Hôtel de Ville de Paris"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Adresse d'arrivée"
                value={missionForm.arrivalAddress}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, arrivalAddress: text }))}
                placeholder="Adresse complète"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Input
                label="Nombre de passagers max"
                value={missionForm.maxPassengers}
                onChangeText={(text) => setMissionForm(prev => ({ ...prev, maxPassengers: text }))}
                placeholder="4"
                keyboardType="numeric"
              />
            </View>

            {/* Sélection de l'entreprise */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Entreprise cliente *
            </Text>
            <View style={styles.pickerContainer}>
              {Object.values(companies).map((company) => (
                <Button
                  key={company.id}
                  title={company.name}
                  variant={missionForm.companyId === company.id ? "primary" : "ghost"}
                  onPress={() => setMissionForm(prev => ({ ...prev, companyId: company.id }))}
                  style={styles.pickerButton}
                />
              ))}
            </View>

            {/* Sélection du chauffeur */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Chauffeur assigné *
            </Text>
            <View style={styles.pickerContainer}>
              {drivers.map((driver) => (
                <Button
                  key={driver.id}
                  title={`${driver.firstName} ${driver.lastName}`}
                  variant={missionForm.driverId === driver.id ? "primary" : "ghost"}
                  onPress={() => setMissionForm(prev => ({ ...prev, driverId: driver.id }))}
                  style={styles.pickerButton}
                />
              ))}
            </View>

            {/* Sélection du véhicule */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Véhicule assigné (optionnel)
            </Text>
            <View style={styles.pickerContainer}>
              {activeVehicles.map((vehicle) => (
                <Button
                  key={vehicle.id}
                  title={`${vehicle.fleetNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                  variant={missionForm.vehicleId === vehicle.id ? "primary" : "ghost"}
                  onPress={() => setMissionForm(prev => ({ ...prev, vehicleId: vehicle.id }))}
                  style={styles.pickerButton}
                />
              ))}
            </View>

            <Button
              title={createLoading ? "Création..." : "Créer la mission"}
              onPress={handleCreateMission}
              variant="primary"
              disabled={createLoading}
              style={styles.createButton}
            />
          </CardContent>
        </Card>

        {/* Liste des missions récentes */}
        <Card variant="elevated" style={styles.section}>
          <CardHeader 
            title="Missions récentes" 
            subtitle={`${missions.length} mission(s) au total`}
          />
          <CardContent>
            {missions.slice(0, 5).map((mission) => (
              <View key={mission.id} style={styles.missionItem}>
                <View style={styles.missionHeader}>
                  <Text style={[styles.missionTitle, { color: colors.text }]}>
                    {mission.title}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: 
                        mission.status === 'COMPLETED' ? colors.success :
                        mission.status === 'IN_PROGRESS' ? colors.info :
                        mission.status === 'PENDING' ? colors.warning :
                        colors.error
                    }
                  ]}>
                    <Text style={[styles.statusText, { color: colors.textOnPrimary }]}>
                      {mission.status === 'PENDING' ? 'En attente' :
                       mission.status === 'IN_PROGRESS' ? 'En cours' :
                       mission.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                  Chauffeur: {drivers.find(d => d.id === mission.driverId)?.firstName} {drivers.find(d => d.id === mission.driverId)?.lastName || 'Non assigné'}
                </Text>
                <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                  Client: {companies[mission.companyId]?.name || 'Inconnu'}
                </Text>
                <Text style={[styles.missionDetail, { color: colors.textSecondary }]}>
                  {mission.departureLocation} → {mission.arrivalLocation}
                </Text>
              </View>
            ))}
            
            {missions.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucune mission trouvée
              </Text>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  headerLogo: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pickerButton: {
    marginBottom: 4,
  },
  createButton: {
    marginTop: 16,
  },
  missionItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  missionDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  quickActionButton: {
    flex: 1,
    minWidth: 150,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
