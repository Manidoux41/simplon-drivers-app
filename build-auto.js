#!/usr/bin/env node

const { spawn } = require('child_process');
const { main: updateVersions } = require('./version-bump');

/**
 * Script de build simplifié avec versioning automatique
 */

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Exécution: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Commande échouée avec le code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  try {
    console.log('🔍 Vérification des prérequis...');
    
    // Vérifier EAS CLI
    await runCommand('eas', ['--version']);
    console.log('✅ EAS CLI trouvé');
    
    // Vérifier Expo CLI  
    await runCommand('expo', ['--version']);
    console.log('✅ Expo CLI trouvé');
    
    // Vérifier l'authentification EAS
    await runCommand('eas', ['whoami']);
    console.log('✅ Authentifié sur EAS');
    
    return true;
  } catch (error) {
    console.error('❌ Prérequis manquants:', error.message);
    console.log('\n📦 Installation requise:');
    console.log('   npm install -g @expo/eas-cli');
    console.log('   npm install -g @expo/cli');
    console.log('   eas login');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'all'; // all, ios, android
  const profile = args[1] || 'development';
  
  console.log('🚀 === BUILD AUTOMATIQUE SIMPLON DRIVERS ===');
  console.log(`📅 ${new Date().toLocaleString('fr-FR')}`);
  console.log(`📱 Plateforme: ${platform}`);
  console.log(`🎯 Profil: ${profile}`);
  console.log('');

  try {
    // 1. Vérifier les prérequis
    const prerequisitesOk = await checkPrerequisites();
    if (!prerequisitesOk) {
      process.exit(1);
    }

    // 2. Mettre à jour les versions
    console.log('\n📝 Mise à jour des versions...');
    const versionInfo = updateVersions();
    
    console.log(`✅ Version mise à jour: ${versionInfo.version}`);
    console.log(`🍎 Build iOS: ${versionInfo.buildNumber}`);
    console.log(`🤖 Version Android: ${versionInfo.versionCode}`);

    // 3. Lancer le build
    console.log('\n🏗️  Lancement du build EAS...');
    
    const buildArgs = [
      'build',
      '--platform', platform,
      '--profile', profile,
      '--non-interactive'
    ];

    await runCommand('eas', buildArgs);

    // 4. Succès
    console.log('\n✅ Build lancé avec succès !');
    console.log('📊 Surveillez sur: https://expo.dev/accounts/superflyman90/projects/simplon-drivers-app/builds');
    console.log('\n📋 Cette version inclut:');
    console.log('   • Suivi des temps de travail');
    console.log('   • Statistiques mensuelles');
    console.log('   • Interface intuitive');
    console.log('   • Corrections diverses');

  } catch (error) {
    console.error('\n❌ Erreur lors du build:', error.message);
    process.exit(1);
  }
}

// Usage
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkPrerequisites };
