#!/bin/bash

# Script de génération des icônes et splash screens à partir du logo Simplon
# Usage: ./generate-icons.sh

set -e

echo "🎨 Génération des icônes et splash screens Simplon"
echo "=================================================="

# Vérifier si ImageMagick est installé
if ! command -v convert &> /dev/null; then
    echo "📦 Installation d'ImageMagick..."
    if command -v brew &> /dev/null; then
        brew install imagemagick
    else
        echo "❌ Veuillez installer ImageMagick manuellement"
        echo "   macOS: brew install imagemagick"
        echo "   Ubuntu: sudo apt install imagemagick"
        exit 1
    fi
fi

# Créer les dossiers nécessaires
mkdir -p assets/images/generated

echo "🖼️ Conversion du logo Simplon..."

# Fichier source
SOURCE="assets/images/logo-simplon.jpg"

if [ ! -f "$SOURCE" ]; then
    echo "❌ Fichier source non trouvé: $SOURCE"
    exit 1
fi

# 1. Icône principale (1024x1024) - Pour store
echo "📱 Génération icône principale (1024x1024)..."
convert "$SOURCE" -resize 1024x1024 -background white -gravity center -extent 1024x1024 assets/images/icon-1024.png

# 2. Icône app standard (512x512)
echo "📱 Génération icône app (512x512)..."
convert "$SOURCE" -resize 512x512 -background white -gravity center -extent 512x512 assets/images/icon.png

# 3. Icône adaptative Android (foreground 432x432 dans 512x512)
echo "🤖 Génération icône adaptive Android..."
convert "$SOURCE" -resize 432x432 -background transparent -gravity center -extent 512x512 assets/images/adaptive-icon.png

# 4. Favicon (48x48)
echo "🌐 Génération favicon..."
convert "$SOURCE" -resize 48x48 -background white -gravity center -extent 48x48 assets/images/favicon.png

# 5. Splash screen (1284x2778 pour iPhone 14 Pro Max)
echo "🎭 Génération splash screen iPhone..."
convert "$SOURCE" -resize 400x400 -background "#ffffff" -gravity center -extent 1284x2778 assets/images/splash-icon.png

# 6. Splash screen Android (1080x1920)
echo "🎭 Génération splash screen Android..."
convert "$SOURCE" -resize 300x300 -background "#ffffff" -gravity center -extent 1080x1920 assets/images/splash-android.png

# 7. Bannière Google Play Store (1024x500)
echo "🏪 Génération bannière store..."
convert "$SOURCE" -resize 400x400 -background "#ffffff" -gravity center -extent 1024x500 assets/images/feature-graphic.png

# 8. Icônes de différentes tailles pour iOS
echo "🍎 Génération icônes iOS..."
sizes=(20 29 40 58 60 76 80 87 120 152 167 180 1024)
for size in "${sizes[@]}"; do
    convert "$SOURCE" -resize ${size}x${size} -background white -gravity center -extent ${size}x${size} "assets/images/generated/icon-${size}.png"
done

# 9. Icônes Android
echo "🤖 Génération icônes Android..."
android_sizes=(36 48 72 96 144 192)
for size in "${android_sizes[@]}"; do
    convert "$SOURCE" -resize ${size}x${size} -background white -gravity center -extent ${size}x${size} "assets/images/generated/android-icon-${size}.png"
done

echo ""
echo "✅ Génération terminée !"
echo ""
echo "📁 Fichiers générés :"
echo "   • assets/images/icon.png (512x512)"
echo "   • assets/images/adaptive-icon.png (512x512)"
echo "   • assets/images/favicon.png (48x48)"
echo "   • assets/images/splash-icon.png (1284x2778)"
echo "   • assets/images/icon-1024.png (pour store)"
echo "   • assets/images/feature-graphic.png (bannière store)"
echo "   • assets/images/generated/ (toutes les tailles)"
echo ""
echo "🎯 Prochaine étape : Mise à jour app.json"
