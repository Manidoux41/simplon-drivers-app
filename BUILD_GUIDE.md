# 🚀 Guide de Build et Versioning - Simplon Drivers App

## 📋 Vue d'ensemble

Cette version inclut un système de **versioning automatique** et de **build optimisé** pour faciliter le déploiement de l'application avec les nouvelles fonctionnalités de suivi des temps de travail.

## 🆕 Nouvelles fonctionnalités (v1.0.2)

### ⏱️ Suivi des temps de travail
- **Saisie intuitive** : Interface heures/minutes pour conduite, repos et attente
- **Statistiques personnalisées** : Tableaux de bord mensuels et quotidiens
- **Agrégation automatique** : Calculs en temps réel des totaux
- **Intégration missions** : Accès direct depuis les détails de mission

### 🛠️ Améliorations techniques
- Résolution des boucles infinies React
- Optimisation des performances avec mémorisation
- Système de migration de base de données
- Corrections du parsing de dates

## 🔄 Système de Versioning Automatique

### Scripts disponibles

```bash
# Incrément automatique (détecte le type via Git)
npm run version:bump

# Incréments spécifiques
npm run version:patch    # 1.0.1 → 1.0.2 (corrections)
npm run version:minor    # 1.0.1 → 1.1.0 (nouvelles fonctionnalités)
npm run version:major    # 1.0.1 → 2.0.0 (changements majeurs)
```

### Logique de détection automatique
- **Major** : commits contenant "breaking" ou "major"
- **Minor** : commits contenant "feat", "feature" ou "minor"  
- **Patch** : par défaut pour corrections et améliorations

## 🏗️ Builds EAS

### Scripts de build avec versioning automatique

```bash
# Build complet (iOS + Android) avec versioning
npm run build:dev

# Builds par plateforme
npm run build:dev:android
npm run build:dev:ios

# Build traditionnel (sans versioning)
npm run build:development
```

### Scripts automatisés

#### macOS/Linux
```bash
./build-dev.sh
```

#### Windows
```bash
build-dev.bat
```

Ces scripts incluent :
- ✅ Mise à jour automatique des versions
- ✅ Vérification des prérequis
- ✅ Confirmation utilisateur
- ✅ Lancement du build EAS
- ✅ Résumé détaillé

## 📊 Profils de build

### Development
- **Distribution** : Interne
- **iOS** : Simulateur + Device
- **Android** : APK
- **Usage** : Tests et développement

### Preview
- **Distribution** : Interne  
- **iOS** : Simulateur
- **Android** : APK
- **Usage** : Tests utilisateur

### Production
- **Distribution** : Store
- **iOS** : App Bundle
- **Android** : AAB
- **Usage** : Publication officielle

## 🚀 Guide de déploiement rapide

### 1. Préparation
```bash
# Installer les outils si nécessaire
npm install -g @expo/eas-cli
npm install -g @expo/cli

# Se connecter à EAS
eas login
```

### 2. Build de développement
```bash
# Méthode rapide
npm run build:dev

# Ou avec le script automatisé
./build-dev.sh  # macOS/Linux
build-dev.bat   # Windows
```

### 3. Surveillance
- 📊 **Tableau de bord** : https://expo.dev/accounts/superflyman90/projects/simplon-drivers-app/builds
- 📱 **Notifications** : Email + notifications EAS CLI
- ⏱️ **Durée** : ~10-15 minutes par plateforme

### 4. Installation

#### Android
1. Télécharger l'APK depuis le tableau EAS
2. Installer sur l'appareil (autoriser sources inconnues)
3. Tester les fonctionnalités

#### iOS
1. Build Simulator : Glisser-déposer dans le simulateur
2. Build Device : Installation via TestFlight ou développeur

## 📋 Checklist de test

### ✅ Fonctionnalités principales
- [ ] Création de missions (simple + avancé)
- [ ] Sélection véhicules/chauffeurs
- [ ] Calcul d'itinéraires
- [ ] Gestion du kilométrage

### ✅ Nouvelles fonctionnalités temps
- [ ] Saisie temps de travail (mission en cours)
- [ ] Modification temps (mission terminée)
- [ ] Statistiques mensuelles (profil chauffeur)
- [ ] Navigation entre mois
- [ ] Agrégation automatique des totaux

### ✅ Stabilité
- [ ] Pas de boucles infinies
- [ ] Navigation fluide
- [ ] Chargement des données
- [ ] Gestion d'erreurs

## 🔍 Debugging

### Logs de build
```bash
# Voir les builds récents
eas build:list

# Logs détaillés d'un build
eas build:view [BUILD_ID]
```

### Logs de versioning
Le script `version-bump.js` affiche :
- Version actuelle vs nouvelle
- Build numbers iOS/Android
- Métadonnées de build
- Liste des fonctionnalités

### Problèmes courants

**Erreur d'authentification EAS**
```bash
eas logout
eas login
```

**Problème de version**
```bash
# Vérifier la configuration
cat app.json | grep -A 5 -B 5 version
```

**Build qui échoue**
- Vérifier les logs EAS détaillés
- S'assurer que toutes les dépendances sont installées
- Valider la configuration `eas.json`

## 📈 Métriques de version

### Version 1.0.2-dev.111
- **Commits** : 111 depuis le début
- **Nouvelles features** : 5 majeures
- **Corrections** : Multiple bugs résolus
- **Base de données** : 4 nouvelles colonnes + 1 table
- **Composants** : 2 nouveaux (MissionTimeTracker, WorkTimeStats)

---

## 🎯 Prochaines étapes

1. **Test de la v1.0.2** sur appareils réels
2. **Feedback utilisateur** sur le suivi des temps
3. **Optimisations** basées sur l'usage
4. **Version 1.1.0** avec nouvelles fonctionnalités selon retours

---

**📞 Support** : En cas de problème, vérifier les logs et la documentation EAS officielle.
