import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';

export default function AdminDashboard() {
  const router = useRouter();

  const adminActions = [
    {
      id: 'create-mission',
      title: 'Nouvelle Mission',
      description: 'Créer une nouvelle mission de transport',
      icon: 'add-circle' as const,
      color: Colors.light.primary,
      route: '/admin/create-mission',
    },
    {
      id: 'all-missions',
      title: 'Toutes les Missions',
      description: 'Voir et gérer toutes les missions',
      icon: 'list' as const,
      color: '#6366f1',
      route: '/admin/all-missions',
    },
    {
      id: 'vehicles',
      title: 'Gestion de la Flotte',
      description: 'Gérer les véhicules et leur statut',
      icon: 'car' as const,
      color: '#10b981',
      route: '/admin/vehicles',
    },
    {
      id: 'users',
      title: 'Gestion des Utilisateurs',
      description: 'Gérer les conducteurs et administrateurs',
      icon: 'people' as const,
      color: '#f59e0b',
      route: '/admin/users',
    },
    {
      id: 'test-geocoding',
      title: 'Test Géocodage',
      description: 'Tester le système de géocodage intelligent',
      icon: 'location' as const,
      color: '#8b5cf6',
      route: '/admin/test-geocoding',
    },
    {
      id: 'test-french-api',
      title: 'API Française',
      description: 'Tester l\'API gouvernementale (35k+ communes)',
      icon: 'earth' as const,
      color: '#10b981',
      route: '/admin/test-french-api',
    },
    {
      id: 'map-test',
      title: 'Test des Cartes',
      description: 'Tester les fonctionnalités de cartographie',
      icon: 'map' as const,
      color: '#8b5cf6',
      route: '/admin/map-test',
    },
    {
      id: 'test-mission-confirmation',
      title: 'Test Confirmation Mission',
      description: 'Tester le système de confirmation de mission',
      icon: 'checkmark-circle' as const,
      color: '#ef4444',
      route: '/admin/test-mission-confirmation',
    },
  ];

  const handleActionPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Administration" 
        showLogo={true}
        style={styles.headerStyle}
      />
      
      {/* Bouton de retour */}
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>
            Tableau de bord administrateur
          </Text>
          <Text style={styles.subtitleText}>
            Gérez vos missions, véhicules et utilisateurs
          </Text>

          {/* Grille d'actions */}
          <View style={styles.actionsGrid}>
            {adminActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={() => handleActionPress(action.route)}
                activeOpacity={0.7}
              >
                <Card style={styles.cardContent}>
                  <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={32} color="white" />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                  <View style={styles.actionFooter}>
                    <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Section statistiques rapides */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Aperçu rapide</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="car" size={24} color={Colors.light.primary} />
                <Text style={styles.statNumber}>5</Text>
                <Text style={styles.statLabel}>Véhicules</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color="#10b981" />
                <Text style={styles.statNumber}>-</Text>
                <Text style={styles.statLabel}>Conducteurs</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="list" size={24} color="#f59e0b" />
                <Text style={styles.statNumber}>-</Text>
                <Text style={styles.statLabel}>Missions</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerStyle: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    width: '47%', // Deux colonnes avec espacement
    minWidth: 150,
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
  actionFooter: {
    marginTop: 8,
  },
  statsSection: {
    marginTop: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
