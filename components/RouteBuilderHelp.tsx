import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface RouteBuilderHelpProps {
  visible: boolean;
  onClose: () => void;
}

export function RouteBuilderHelp({ visible, onClose }: RouteBuilderHelpProps) {
  const colors = Colors.light;

  const helpSteps = [
    {
      icon: 'play-circle',
      color: colors.success,
      title: 'Point de départ',
      description: 'Commencez par définir votre point de départ. Tapez l\'adresse complète incluant le numéro, la rue et la ville.'
    },
    {
      icon: 'flag',
      color: colors.error,
      title: 'Destination',
      description: 'Ajoutez ensuite votre destination finale de la même manière.'
    },
    {
      icon: 'location',
      color: colors.info,
      title: 'Étapes intermédiaires',
      description: 'Vous pouvez ajouter jusqu\'à 6 étapes intermédiaires pour créer un itinéraire détaillé.'
    },
    {
      icon: 'map',
      color: colors.primary,
      title: 'Prévisualisation',
      description: 'Visualisez votre itinéraire complet avec les distances et durées calculées automatiquement.'
    }
  ];

  const addressTips = [
    'Utilisez des adresses complètes : "12 rue de la Paix, 75001 Paris"',
    'Vous pouvez taper sur la carte pour sélectionner une position',
    'Le bouton de localisation vous géolocalise automatiquement',
    'Réorganisez les étapes en les déplaçant vers le haut ou le bas'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Guide d'utilisation
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Introduction */}
          <View style={[styles.section, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.introText, { color: colors.text }]}>
              Créez des itinéraires détaillés avec plusieurs étapes pour vos missions de transport.
            </Text>
          </View>

          {/* Étapes */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Comment créer votre itinéraire
          </Text>
          
          {helpSteps.map((step, index) => (
            <View key={index} style={[styles.stepCard, { backgroundColor: colors.card }]}>
              <View style={[styles.stepIcon, { backgroundColor: step.color + '15' }]}>
                <Ionicons name={step.icon as any} size={24} color={step.color} />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>
                  {index + 1}. {step.title}
                </Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}

          {/* Conseils pour les adresses */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Conseils pour les adresses
          </Text>
          
          {addressTips.map((tip, index) => (
            <View key={index} style={[styles.tipCard, { backgroundColor: colors.info + '10' }]}>
              <Ionicons name="bulb" size={16} color={colors.info} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {tip}
              </Text>
            </View>
          ))}

          {/* Fonctionnalités avancées */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Fonctionnalités avancées
          </Text>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="analytics" size={20} color={colors.warning} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Optimisation automatique
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                L'ordre des étapes peut être optimisé automatiquement pour réduire la distance totale.
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Ionicons name="map" size={20} color={colors.success} />
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Aperçu temps réel
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Visualisez votre itinéraire complet avec distances, durées et carte interactive.
              </Text>
            </View>
          </View>

          {/* Bouton de fermeture */}
          <TouchableOpacity
            style={[styles.gotItButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.gotItButtonText}>J'ai compris !</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  stepCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  gotItButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  gotItButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
