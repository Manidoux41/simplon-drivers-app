#!/bin/bash

# Script de build automatique pour Simplon Drivers App
# Ce script prépare et lance un build EAS avec versioning automatique

set -e  # Arrêter en cas d'erreur

echo "🚀 === BUILD SIMPLON DRIVERS APP ==="
echo "📅 Date: $(date)"
echo ""

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -f "app.json" ]; then
    echo "❌ Erreur: app.json non trouvé. Assurez-vous d'être dans le répertoire du projet."
    exit 1
fi

# 2. Vérifier les outils nécessaires
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI n'est pas installé."
    echo "📦 Installation: npm install -g @expo/eas-cli"
    exit 1
fi

if ! command -v expo &> /dev/null; then
    echo "❌ Expo CLI n'est pas installé."
    echo "📦 Installation: npm install -g @expo/cli"
    exit 1
fi

# 3. Mettre à jour les versions automatiquement
echo "📝 Mise à jour automatique des versions..."
node version-bump.js

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la mise à jour des versions"
    exit 1
fi

# 4. Afficher les informations de build
echo ""
echo "📋 Informations de build:"
VERSION=$(node -p "require('./app.json').expo.version")
BUILD_NUMBER=$(node -p "require('./app.json').expo.ios.buildNumber")
VERSION_CODE=$(node -p "require('./app.json').expo.android.versionCode")

echo "   Version: $VERSION"
echo "   Build iOS: $BUILD_NUMBER"
echo "   Version Code Android: $VERSION_CODE"
echo ""

# 5. Vérifier le statut EAS
echo "🔐 Vérification de l'authentification EAS..."
eas whoami

if [ $? -ne 0 ]; then
    echo "❌ Non connecté à EAS. Veuillez vous connecter:"
    echo "   eas login"
    exit 1
fi

# 6. Afficher la configuration de build
echo ""
echo "⚙️  Configuration de build (profile: development):"
echo "   Distribution: internal"
echo "   iOS: Simulator + Device"
echo "   Android: APK"
echo ""

# 7. Demander confirmation
read -p "🚀 Lancer le build pour iOS et Android ? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Build annulé par l'utilisateur"
    exit 0
fi

# 8. Lancer le build
echo ""
echo "🏗️  Lancement du build EAS..."
echo "📱 Plateformes: iOS + Android"
echo "🎯 Profil: development"
echo ""

eas build --platform all --profile development --non-interactive

# 9. Résumé final
BUILD_EXIT_CODE=$?
echo ""
echo "🎯 === RÉSUMÉ DU BUILD ==="

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build lancé avec succès !"
    echo "📊 Surveillez le progrès sur: https://expo.dev/accounts/superflyman90/projects/simplon-drivers-app/builds"
    echo ""
    echo "📋 Détails de cette version:"
    echo "   • Suivi des temps de travail (conduite, repos, attente)"
    echo "   • Statistiques mensuelles et quotidiennes"
    echo "   • Interface de saisie intuitive"
    echo "   • Agrégation automatique des données"
    echo "   • Corrections diverses et améliorations"
    echo ""
    echo "🔗 Une fois le build terminé, vous pourrez:"
    echo "   • Télécharger l'APK Android"
    echo "   • Installer l'app iOS via TestFlight ou simulateur"
    echo "   • Tester les nouvelles fonctionnalités"
else
    echo "❌ Erreur lors du lancement du build"
    echo "🔍 Vérifiez les logs ci-dessus pour plus de détails"
    exit $BUILD_EXIT_CODE
fi

echo ""
echo "🚀 Script terminé avec succès !"
