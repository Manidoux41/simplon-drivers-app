import React from 'react';
import { View, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/Button';
import { Colors } from '../constants/Colors';

interface RouteNavigationButtonsProps {
  departureLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  arrivalLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  style?: any;
}

export const RouteNavigationButtons: React.FC<RouteNavigationButtonsProps> = ({
  departureLocation,
  arrivalLocation,
  style,
}) => {
  
  const openInGoogleMaps = async () => {
    try {
      const origin = `${departureLocation.latitude},${departureLocation.longitude}`;
      const destination = `${arrivalLocation.latitude},${arrivalLocation.longitude}`;
      
      // URL pour Google Maps avec paramètres pour autocar
      const url = Platform.select({
        ios: `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving&avoid=highways`,
        android: `google.navigation:q=${destination}&waypoints=${origin}&mode=d&avoid=h`,
        default: `https://www.google.com/maps/dir/${origin}/${destination}?travelmode=driving&avoid=highways`,
      });

      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback vers le navigateur web
        const webUrl = `https://www.google.com/maps/dir/${origin}/${destination}?travelmode=driving&avoid=highways`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de Google Maps:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir Google Maps. Vérifiez que l\'application est installée.',
        [{ text: 'OK' }]
      );
    }
  };

  const openInWaze = async () => {
    try {
      // URL pour Waze
      const wazeUrl = `waze://?ll=${arrivalLocation.latitude},${arrivalLocation.longitude}&navigate=yes`;
      
      const supported = await Linking.canOpenURL(wazeUrl);
      
      if (supported) {
        await Linking.openURL(wazeUrl);
      } else {
        Alert.alert(
          'Waze non disponible',
          'L\'application Waze n\'est pas installée sur votre appareil. Souhaitez-vous l\'installer ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Installer', 
              onPress: () => {
                const storeUrl = Platform.select({
                  ios: 'https://apps.apple.com/app/waze-navigation-live-traffic/id323229106',
                  android: 'https://play.google.com/store/apps/details?id=com.waze',
                });
                if (storeUrl) {
                  Linking.openURL(storeUrl);
                }
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de Waze:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir Waze.',
        [{ text: 'OK' }]
      );
    }
  };

  const openInAppleMaps = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Non disponible', 'Apple Maps n\'est disponible que sur iOS.');
      return;
    }

    try {
      const origin = `${departureLocation.latitude},${departureLocation.longitude}`;
      const destination = `${arrivalLocation.latitude},${arrivalLocation.longitude}`;
      
      // URL pour Apple Maps avec mode de transport approprié pour les autocars
      const url = `maps://?saddr=${origin}&daddr=${destination}&dirflg=d&t=m`;
      
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'ouvrir Apple Maps.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture d\'Apple Maps:', error);
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir Apple Maps.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.buttonRow}>
        <Button
          title="Google Maps"
          onPress={openInGoogleMaps}
          variant="outline"
          style={styles.navButton}
          icon={<Ionicons name="navigate" size={18} color={Colors.light.primary} />}
        />
        
        <Button
          title="Waze"
          onPress={openInWaze}
          variant="outline"
          style={styles.navButton}
          icon={<Ionicons name="car-sport" size={18} color={Colors.light.primary} />}
        />
        
        {Platform.OS === 'ios' && (
          <Button
            title="Apple Maps"
            onPress={openInAppleMaps}
            variant="outline"
            style={styles.navButton}
            icon={<Ionicons name="map" size={18} color={Colors.light.primary} />}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
});
