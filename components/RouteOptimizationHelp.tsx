import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface RouteOptimizationHelpProps {
  style?: any;
}

export const RouteOptimizationHelp: React.FC<RouteOptimizationHelpProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>🗺️ Itinéraire Optimisé</Text>
      <Text style={styles.description}>
        Visualisez l'itinéraire optimisé pour votre mission avec :
      </Text>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>🚛</Text>
          <Text style={styles.featureText}>
            Calcul adapté au type de véhicule (poids lourd ou standard)
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>⚠️</Text>
          <Text style={styles.featureText}>
            Avertissements pour restrictions (hauteur, poids, etc.)
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>🌍</Text>
          <Text style={styles.featureText}>
            Cartes OpenStreetMap avec itinéraire détaillé
          </Text>
        </View>
        
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>📊</Text>
          <Text style={styles.featureText}>
            Distance, durée et informations de trajet en temps réel
          </Text>
        </View>
      </View>
      
      <Text style={styles.note}>
        💡 <Text style={styles.noteText}>
          Conseil : Utilisez cette fonction avant de démarrer votre mission pour connaître 
          le meilleur itinéraire selon votre véhicule.
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  featureList: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  featureText: {
    fontSize: 13,
    color: Colors.light.text,
    flex: 1,
    lineHeight: 18,
  },
  note: {
    fontSize: 12,
    color: Colors.light.info,
    backgroundColor: '#e6f3ff',
    padding: 10,
    borderRadius: 8,
    lineHeight: 16,
  },
  noteText: {
    fontStyle: 'italic',
  },
});

export default RouteOptimizationHelp;