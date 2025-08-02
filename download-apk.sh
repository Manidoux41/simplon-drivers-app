#!/bin/bash

# Script de téléchargement APK Simplon Drivers
# Usage: ./download-apk.sh

echo "📱 Téléchargement APK Simplon Drivers"
echo "===================================="
echo ""

# Fonction pour lister les builds APK
list_apk_builds() {
    echo "🔍 Recherche des builds APK récents..."
    eas build:list --platform=android --limit=5
}

# Fonction pour télécharger le dernier APK
download_latest_apk() {
    echo "📥 Téléchargement du dernier APK..."
    
    # Créer dossier de téléchargement
    mkdir -p downloads
    
    echo "💡 Pour télécharger un APK spécifique :"
    echo "   1. Notez le BUILD_ID depuis la liste ci-dessus"
    echo "   2. Utilisez : eas build:view BUILD_ID --download"
    echo "   3. Ou téléchargez depuis : https://expo.dev"
    echo ""
}

# Fonction pour afficher les instructions d'installation
show_install_instructions() {
    echo "📋 Instructions d'installation APK :"
    echo ""
    echo "🤖 Sur Android :"
    echo "   1. Téléchargez le fichier .apk"
    echo "   2. Paramètres > Sécurité > Sources inconnues (activé)"
    echo "   3. Ouvrez le fichier .apk téléchargé"
    echo "   4. Confirmez l'installation"
    echo "   5. L'app Simplon Drivers sera installée !"
    echo ""
    echo "💻 Via ADB (développeurs) :"
    echo "   adb install simplon-drivers.apk"
    echo ""
    echo "🌐 Via QR Code :"
    echo "   • Scannez le QR code depuis expo.dev"
    echo "   • Téléchargement direct sur l'appareil"
    echo ""
}

# Fonction pour afficher le statut
show_status() {
    echo "⏰ Status des builds :"
    list_apk_builds
    echo ""
    
    echo "🎨 Assets intégrés dans l'APK :"
    echo "   ✅ Logo Simplon (icône principale)"
    echo "   ✅ Splash screen Simplon"
    echo "   ✅ Icône adaptative Android"
    echo "   ✅ Toutes fonctionnalités (cartes, routage)"
    echo ""
    
    show_install_instructions
}

# Fonction principale
main() {
    show_status
    
    echo "🎯 Prochaines étapes :"
    echo "   1. Attendez que le build soit terminé (statut: finished)"
    echo "   2. Téléchargez l'APK depuis expo.dev ou CLI"
    echo "   3. Installez sur votre appareil Android"
    echo "   4. Testez l'app avec le logo Simplon !"
    echo ""
    
    echo "🔄 Pour relancer ce script : ./download-apk.sh"
}

# Vérifier les arguments
case "$1" in
    "status")
        list_apk_builds
        ;;
    "instructions")
        show_install_instructions
        ;;
    *)
        main
        ;;
esac
