import { Alert, Platform } from 'react-native';

export const checkMapsSupport = () => {
  // Vérifier si nous sommes dans Expo Go
  const isExpoGo = __DEV__ && Platform.OS !== 'web';
  
  if (isExpoGo) {
    console.warn(
      '⚠️ react-native-maps nécessite un Expo Development Build.\n' +
      'Pour utiliser les cartes, créez un build de développement personnalisé :\n' +
      '1. npm install -g @expo/eas-cli\n' +
      '2. eas build --platform ios --profile development\n' +
      '3. Ou utilisez npm run build:development'
    );
    
    // Afficher une alerte une seule fois
    if (typeof (global as any).__mapsWarningShown === 'undefined') {
      (global as any).__mapsWarningShown = true;
      setTimeout(() => {
        Alert.alert(
          'Cartes nécessitent un build personnalisé',
          'react-native-maps nécessite un Expo Development Build. ' +
          'Consultez MAPS_ACTIVATED.md pour les instructions.',
          [
            { text: 'OK', style: 'default' },
            { text: 'Désactiver les cartes', onPress: () => {
              console.log('💡 Utilisez npm run maps:disable pour revenir aux versions simplifiées');
            }}
          ]
        );
      }, 1000);
    }
  }
  
  return !isExpoGo;
};

export const MapsConfig = {
  isSupported: checkMapsSupport(),
  fallbackMessage: 'Cartes disponibles avec un build personnalisé',
};
