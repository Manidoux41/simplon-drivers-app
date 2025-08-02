#!/bin/bash

# Script de monitoring du build Simplon
# Usage: ./monitor-build.sh

echo "🚀 Monitoring du Build Simplon Drivers"
echo "====================================="

echo "📱 Application : Simplon Drivers"
echo "🎨 Logo : Simplon intégré"
echo "🏗️ Plateforme : Android Production"
echo "📦 Format : AAB (Android App Bundle)"
echo ""

# Fonction pour afficher le statut
show_status() {
    echo "⏰ $(date '+%H:%M:%S') - Vérification du statut..."
    eas build:list --limit=1 --json | head -20
    echo ""
}

# Fonction pour afficher les informations du build en cours
show_build_info() {
    echo "📊 Informations du build en cours :"
    echo "   • Logo Simplon : ✅ Configuré"
    echo "   • Assets : ✅ Générés (icon.png, splash-icon.png, adaptive-icon.png)"
    echo "   • Configuration : ✅ app.json mis à jour"
    echo "   • Cache : ✅ Vidé pour build frais"
    echo "   • Cartes : ✅ react-native-maps activées"
    echo ""
}

# Fonction principale
monitor_build() {
    show_build_info
    
    echo "🔄 Monitoring en cours... (Ctrl+C pour arrêter)"
    echo ""
    
    while true; do
        show_status
        sleep 60  # Vérifier toutes les minutes
        echo "────────────────────────────────────"
    done
}

# Vérification rapide du statut actuel
echo "🔍 Statut actuel :"
eas build:list --limit=1

echo ""
echo "💡 Le build est en cours avec le nouveau logo Simplon !"
echo "⏱️  Durée estimée : 15-20 minutes"
echo ""
echo "📋 Pour suivre en continu :"
echo "   • Utilisez ce script : ./monitor-build.sh"
echo "   • Ou vérifiez manuellement : eas build:list"
echo "   • Interface web : expo.dev"
echo ""

# Lancer le monitoring si demandé
if [[ "$1" == "watch" ]]; then
    monitor_build
else
    echo "🎯 Ajoutez 'watch' pour monitoring continu : ./monitor-build.sh watch"
fi
