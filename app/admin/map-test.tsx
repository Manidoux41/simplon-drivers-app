import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { RouteMap } from '../../components/RouteMap';
import { RouteNavigationButtons } from '../../components/RouteNavigationButtons';
import { Colors } from '../../constants/Colors';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function MapTestScreen() {
  const router = useRouter();

  // Données de test : Paris vers Fontainebleau
  const testRouteData = {
    departure: {
      latitude: 48.8566,
      longitude: 2.3522,
      title: 'Hôtel de Ville de Paris',
      address: '4 Place de l\'Hôtel de Ville, 75004 Paris',
    },
    arrival: {
      latitude: 48.4084,
      longitude: 2.7019,
      title: 'Fontainebleau',
      address: '12 Rue de la Gare, 77300 Fontainebleau',
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" style={styles.headerCard}>
          <CardHeader 
            title="Test des Cartes et Navigation"
            subtitle="Itinéraire Paris → Fontainebleau"
          />
        </Card>

        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Aperçu de l'itinéraire" />
          <CardContent>
            <RouteMap
              departureLocation={testRouteData.departure}
              arrivalLocation={testRouteData.arrival}
              height={300}
              style={styles.map}
            />
          </CardContent>
        </Card>

        <Card variant="elevated" style={styles.section}>
          <CardHeader title="Navigation externe" />
          <CardContent>
            <RouteNavigationButtons
              departureLocation={testRouteData.departure}
              arrivalLocation={testRouteData.arrival}
            />
          </CardContent>
        </Card>

        <Card variant="elevated" style={styles.section}>
          <CardContent>
            <Button
              title="Retour"
              onPress={() => router.back()}
              variant="secondary"
            />
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  map: {
    borderRadius: 8,
    marginBottom: 8,
  },
});
