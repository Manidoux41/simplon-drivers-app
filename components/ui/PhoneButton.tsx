import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Colors } from '../../constants/Colors';

interface PhoneButtonProps {
  phoneNumber?: string;
  size?: number;
  color?: string;
  style?: any;
}

export function PhoneButton({ phoneNumber, size = 20, color = Colors.light.primary, style }: PhoneButtonProps) {
  const handleCall = async () => {
    if (!phoneNumber) {
      Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
      return;
    }

    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Vérifier si le numéro est valide
    if (!/^\+?[0-9]{10,15}$/.test(cleanedNumber)) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide');
      return;
    }

    const phoneUrl = `tel:${cleanedNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        Alert.alert(
          'Appeler',
          `Voulez-vous appeler le ${phoneNumber} ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Appeler', 
              onPress: () => Linking.openURL(phoneUrl),
              style: 'default'
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application téléphone');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du téléphone:', error);
      Alert.alert('Erreur', 'Impossible d\'initier l\'appel');
    }
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={[styles.phoneButton, style]} 
      onPress={handleCall}
      activeOpacity={0.7}
    >
      <Ionicons name="call" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  phoneButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
    minHeight: 36,
  },
});
