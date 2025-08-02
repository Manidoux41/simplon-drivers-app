#!/bin/bash

# Script de publication automatisé pour Google Play Store
# Usage: ./publish-android.sh

set -e

echo "🚀 Début de la publication Android pour Google Play Store"
echo "=================================================="

# 1. Vérification des prérequis
echo "🔍 Vérification des prérequis..."

if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI n'est pas installé. Installation..."
    npm install -g eas-cli@latest
fi

# 2. Vérification de la connexion
echo "👤 Vérification de la connexion EAS..."
if ! eas whoami &> /dev/null; then
    echo "❌ Pas connecté à EAS. Veuillez vous connecter:"
    echo "   eas login"
    exit 1
fi

# 3. Nettoyage et préparation
echo "🧹 Nettoyage du projet..."
rm -rf node_modules/.cache || true
npm install

# 4. Activation des cartes pour production
echo "🗺️ Activation des cartes pour production..."
npm run maps:enable

# 5. Vérification de la configuration
echo "⚙️ Vérification de la configuration..."
if [ ! -f "eas.json" ]; then
    echo "❌ Fichier eas.json manquant"
    exit 1
fi

if [ ! -f "app.json" ]; then
    echo "❌ Fichier app.json manquant"
    exit 1
fi

# 6. Build de production
echo "🏗️ Lancement du build de production Android..."
echo "   Cela peut prendre 10-20 minutes..."
eas build --platform android --profile production --non-interactive

# 7. Récupération de l'URL du build
echo "📱 Build terminé ! Récupération des informations..."
eas build:list --limit=1 --platform=android --status=finished

echo ""
echo "✅ Build de production terminé avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Téléchargez le fichier AAB depuis expo.dev"
echo "2. Ou utilisez: eas submit --platform android"
echo "3. Consultez PUBLICATION_GOOGLE_PLAY.md pour la suite"
echo ""
echo "🎉 Votre application est prête pour Google Play Store !"
