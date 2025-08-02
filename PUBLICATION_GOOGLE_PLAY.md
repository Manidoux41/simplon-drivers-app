# 🚀 Guide de Publication Google Play Store

## 📋 Prérequis

### 1. Compte Google Play Console
- Créer un compte développeur Google Play (25$ d'inscription unique)
- Accéder à [Google Play Console](https://play.google.com/console)

### 2. Outils nécessaires
```bash
# Installation EAS CLI (si pas déjà fait)
npm install -g @expo/eas-cli

# Connexion à votre compte Expo
eas login
```

## 🔑 Configuration Clés et Certificats

### 1. Générer une clé de signature
```bash
# EAS gère automatiquement les clés
eas credentials
```

### 2. Service Account Google (pour soumission automatique)
1. Allez dans [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez existant
3. Activez l'API Google Play Android Developer
4. Créez un compte de service :
   - IAM & Admin > Comptes de service
   - Créer un compte de service
   - Télécharger la clé JSON
5. Renommez le fichier : `google-service-account.json`
6. Placez-le à la racine du projet

### 3. Permissions Google Play Console
1. Google Play Console > Paramètres > Accès aux API
2. Lier le projet Google Cloud
3. Accorder les permissions au compte de service

## 🏗️ Build de Production

### 1. Build AAB (Android App Bundle)
```bash
# Build pour production (génère un fichier .aab)
eas build --platform android --profile production

# Ou via script npm
npm run build:production:android

# Suivre le processus dans le terminal
# Le build sera disponible sur expo.dev
```

### 2. Vérification du build
```bash
# Lister les builds récents
eas build:list

# Voir les détails d'un build
eas build:view [BUILD_ID]

# Télécharger le fichier AAB
# Disponible via interface web expo.dev
```

## 📤 Soumission Automatique

### 1. Configuration automatique
```bash
# Soumettre directement depuis EAS
eas submit --platform android --profile production

# Ou spécifier le fichier AAB
eas submit --platform android --path ./app-release.aab
```

### 2. Soumission manuelle (alternative)
1. Télécharger le fichier AAB depuis expo.dev
2. Aller sur Google Play Console
3. Créer une nouvelle application
4. Télécharger le fichier AAB dans "Version de production"

## 📝 Informations Store Requises

### 1. Métadonnées de l'application
- **Nom** : Simplon Drivers
- **Description courte** : Application de gestion de transport
- **Description complète** : (voir ci-dessous)
- **Catégorie** : Outils ou Business
- **Politique de confidentialité** : URL requise

### 2. Description complète suggérée
```
Simplon Drivers - Application de Gestion de Transport

🚛 Fonctionnalités principales :
• Gestion complète des missions de transport
• Calcul d'itinéraires optimisés
• Suivi en temps réel des véhicules
• Gestion des conducteurs et équipes
• Interface intuitive et moderne

🗺️ Navigation intégrée :
• Cartes interactives
• Calculs de distance précis
• Intégration avec Google Maps
• Géolocalisation française complète

👥 Gestion d'équipe :
• Attribution des missions
• Suivi des performances
• Communication directe
• Notifications en temps réel

🔧 Outils administrateur :
• Tableau de bord complet
• Rapports détaillés
• Gestion des véhicules
• Configuration flexible

Application destinée aux entreprises de transport et logistique.
```

### 3. Captures d'écran requises
- 2-8 captures d'écran (1080x1920 ou 1080x2340)
- Icône haute résolution (512x512)
- Bannière de fonctionnalité (1024x500)

## 🎯 Scripts de Publication

### 1. Build et soumission complète
```bash
# Script complet de publication
npm run publish:android
```

### 2. Build seulement
```bash
# Build production seulement
npm run build:production:android
```

### 3. Soumission seulement
```bash
# Soumettre un build existant
npm run submit:android
```

## ⚠️ Vérifications Avant Publication

### 1. Tests obligatoires
- [ ] Test sur appareil physique Android
- [ ] Vérification permissions
- [ ] Test fonctionnalités cartes
- [ ] Validation formulaires
- [ ] Test navigation

### 2. Conformité Google Play
- [ ] Politique de confidentialité
- [ ] Contenu approprié
- [ ] Permissions justifiées
- [ ] Description précise
- [ ] Captures d'écran à jour

### 3. Optimisations
- [ ] Taille APK optimisée
- [ ] Performance validée
- [ ] Compatibilité Android 6+
- [ ] Support 64-bit

## 🔄 Mise à jour de Version

Pour les futures mises à jour :

```bash
# 1. Incrémenter version dans app.json
# "version": "1.0.1"
# "versionCode": 2

# 2. Build nouvelle version
eas build --platform android --profile production

# 3. Soumettre mise à jour
eas submit --platform android --profile production
```

## 📞 Support et Dépannage

### Erreurs communes :
1. **Clé signature manquante** : `eas credentials`
2. **Permissions Google** : Vérifier compte de service
3. **Build échec** : Vérifier logs EAS
4. **Soumission refusée** : Vérifier conformité Google Play

### Ressources utiles :
- [Documentation EAS Submit](https://docs.expo.dev/submit/android/)
- [Guide Google Play Console](https://support.google.com/googleplay/android-developer/)
- [Politique Google Play](https://play.google.com/about/developer-policy/)

---
**Prêt pour la publication ! 🚀**
