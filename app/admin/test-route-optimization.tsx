import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Header } from '../../components/ui/Header';
import { RouteOptimizationTest } from '../../components/RouteOptimizationTest';

export default function TestRouteOptimization() {
  const router = useRouter();
  const [showTest, setShowTest] = useState(false);

  return (
    <View style={styles.container}>
      <Header 
        title="Test Optimisation Itinéraire" 
        showLogo={true}
        style={styles.headerStyle}
      />
      
      <View style={styles.actionBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.title}>Test d'Optimisation d'Itinéraire</Text>
          <Text style={styles.description}>
            Cette page permet de tester le système d'optimisation d'itinéraire spécialement 
            conçu pour les véhicules de plus de 19 tonnes.
          </Text>
        </View>

        <View style={styles.featuresList}>
          <Text style={styles.featuresTitle}>Fonctionnalités testées :</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
            <Text style={styles.featureText}>Détection automatique des poids lourds</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
            <Text style={styles.featureText}>Calcul d'itinéraire optimisé</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
            <Text style={styles.featureText}>Restrictions de circulation</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
            <Text style={styles.featureText}>Calcul des péages</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
            <Text style={styles.featureText}>Avertissements spécialisés</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setShowTest(true)}
        >
          <Ionicons name="flask" size={24} color="white" />
          <Text style={styles.testButtonText}>Lancer les Tests</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.light.info} />
          <Text style={styles.infoText}>
            Le test utilise un trajet Paris → Lyon avec un véhicule de 32 tonnes 
            pour valider le bon fonctionnement du système d'optimisation.
          </Text>
        </View>
      </View>

      <Modal 
        visible={showTest} 
        animationType="slide" 
        presentationStyle="pageSheet"
      >
        <RouteOptimizationTest onClose={() => setShowTest(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerStyle: {
    backgroundColor: Colors.light.primary,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  featuresList: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  testButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.info,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});