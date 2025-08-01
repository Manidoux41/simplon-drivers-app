# Guide d'activation des cartes

## Contexte
Les cartes sont maintenant activées dans l'application en utilisant `react-native-maps`. Cependant, cette librairie nécessite des modules natifs qui ne sont pas disponibles dans Expo Go.

## Solutions disponibles

### 1. Expo Development Build (Recommandé)
Pour utiliser l'application avec les cartes, vous devez créer un build de développement personnalisé :

```bash
# Installer EAS CLI si pas déjà fait
npm install -g @expo/eas-cli

# Se connecter à Expo
eas login

# Configurer EAS
eas build:configure

# Créer un build de développement pour iOS
eas build --platform ios --profile development

# Créer un build de développement pour Android
eas build --platform android --profile development
```

### 2. Configuration automatique
Un script est disponible pour simplifier le processus :

```bash
npm run build:development
```

### 3. Fallback vers version simplifiée
Si vous voulez revenir à la version sans cartes pour Expo Go :

```bash
npm run maps:disable
```

Pour réactiver les cartes :

```bash
npm run maps:enable
```

## Fichiers importants

### Composants avec cartes
- `components/IntegratedRouteMap.tsx` - Affichage intégré des routes
- `components/AddressPickerWithMap.tsx` - Sélection d'adresse avec carte
- `app/admin/create-mission.tsx` - Version avec cartes
- `app/admin/test-route-integration.tsx` - Tests avec cartes

### Versions de fallback (sans cartes)
- `app/admin/create-mission-simple.tsx`
- `app/admin/test-route-integration-simple.tsx`

## Services fonctionnels
Tous les services restent fonctionnels même sans cartes visuelles :
- ✅ RouteCalculationService - Calcul d'itinéraires avec OpenRoute API
- ✅ GeocodingService - Géocodage d'adresses
- ✅ FrenchCityAPI - Base de données des communes françaises
- ✅ Calculs de distance et durée
- ✅ Cache des requêtes

## Status actuel
🎯 **Cartes activées** - L'application utilise maintenant `react-native-maps`
⚠️ **Build requis** - Nécessite un Expo Development Build pour fonctionner
✅ **Fallback disponible** - Versions simplifiées préservées pour Expo Go
