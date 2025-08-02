@echo off
setlocal enabledelayedexpansion

REM Script de build automatique pour Simplon Drivers App (Windows)
REM Ce script prépare et lance un build EAS avec versioning automatique

echo 🚀 === BUILD SIMPLON DRIVERS APP ===
echo 📅 Date: %date% %time%
echo.

REM 1. Vérifier que nous sommes dans le bon répertoire
if not exist "app.json" (
    echo ❌ Erreur: app.json non trouvé. Assurez-vous d'être dans le répertoire du projet.
    pause
    exit /b 1
)

REM 2. Vérifier les outils nécessaires
where eas >nul 2>nul
if errorlevel 1 (
    echo ❌ EAS CLI n'est pas installé.
    echo 📦 Installation: npm install -g @expo/eas-cli
    pause
    exit /b 1
)

where expo >nul 2>nul
if errorlevel 1 (
    echo ❌ Expo CLI n'est pas installé.
    echo 📦 Installation: npm install -g @expo/cli
    pause
    exit /b 1
)

REM 3. Mettre à jour les versions automatiquement
echo 📝 Mise à jour automatique des versions...
node version-bump.js

if errorlevel 1 (
    echo ❌ Erreur lors de la mise à jour des versions
    pause
    exit /b 1
)

REM 4. Afficher les informations de build
echo.
echo 📋 Informations de build:
for /f "tokens=*" %%i in ('node -p "require('./app.json').expo.version"') do set VERSION=%%i
for /f "tokens=*" %%i in ('node -p "require('./app.json').expo.ios.buildNumber"') do set BUILD_NUMBER=%%i
for /f "tokens=*" %%i in ('node -p "require('./app.json').expo.android.versionCode"') do set VERSION_CODE=%%i

echo    Version: %VERSION%
echo    Build iOS: %BUILD_NUMBER%
echo    Version Code Android: %VERSION_CODE%
echo.

REM 5. Vérifier le statut EAS
echo 🔐 Vérification de l'authentification EAS...
eas whoami

if errorlevel 1 (
    echo ❌ Non connecté à EAS. Veuillez vous connecter:
    echo    eas login
    pause
    exit /b 1
)

REM 6. Afficher la configuration de build
echo.
echo ⚙️  Configuration de build (profile: development):
echo    Distribution: internal
echo    iOS: Simulator + Device
echo    Android: APK
echo.

REM 7. Demander confirmation
set /p "REPLY=🚀 Lancer le build pour iOS et Android ? (y/N): "
if /i not "%REPLY%"=="y" (
    echo ❌ Build annulé par l'utilisateur
    pause
    exit /b 0
)

REM 8. Lancer le build
echo.
echo 🏗️  Lancement du build EAS...
echo 📱 Plateformes: iOS + Android
echo 🎯 Profil: development
echo.

eas build --platform all --profile development --non-interactive

REM 9. Résumé final
echo.
echo 🎯 === RÉSUMÉ DU BUILD ===

if errorlevel 1 (
    echo ❌ Erreur lors du lancement du build
    echo 🔍 Vérifiez les logs ci-dessus pour plus de détails
    pause
    exit /b 1
) else (
    echo ✅ Build lancé avec succès !
    echo 📊 Surveillez le progrès sur: https://expo.dev/accounts/superflyman90/projects/simplon-drivers-app/builds
    echo.
    echo 📋 Détails de cette version:
    echo    • Suivi des temps de travail (conduite, repos, attente)
    echo    • Statistiques mensuelles et quotidiennes
    echo    • Interface de saisie intuitive
    echo    • Agrégation automatique des données
    echo    • Corrections diverses et améliorations
    echo.
    echo 🔗 Une fois le build terminé, vous pourrez:
    echo    • Télécharger l'APK Android
    echo    • Installer l'app iOS via TestFlight ou simulateur
    echo    • Tester les nouvelles fonctionnalités
)

echo.
echo 🚀 Script terminé avec succès !
pause
