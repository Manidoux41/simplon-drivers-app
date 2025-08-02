#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script de versioning automatique pour Simplon Drivers App
 * Incrémente automatiquement les versions en fonction des changements
 */

function getAppConfig() {
  const appConfigPath = path.join(__dirname, 'app.json');
  return JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
}

function saveAppConfig(config) {
  const appConfigPath = path.join(__dirname, 'app.json');
  fs.writeFileSync(appConfigPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

function getPackageConfig() {
  const packagePath = path.join(__dirname, 'package.json');
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function savePackageConfig(config) {
  const packagePath = path.join(__dirname, 'package.json');
  fs.writeFileSync(packagePath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

function getGitCommitCount() {
  try {
    return parseInt(execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim());
  } catch (error) {
    console.warn('⚠️  Impossible de récupérer le nombre de commits Git. Utilisation d\'un numéro par défaut.');
    return Date.now(); // Fallback avec timestamp
  }
}

function detectChangeType() {
  try {
    // Analyser les derniers commits pour détecter le type de changement
    const lastCommit = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim().toLowerCase();
    
    if (lastCommit.includes('breaking') || lastCommit.includes('major')) {
      return 'major';
    }
    if (lastCommit.includes('feat') || lastCommit.includes('feature') || lastCommit.includes('minor')) {
      return 'minor';
    }
    return 'patch';
  } catch (error) {
    console.warn('⚠️  Impossible d\'analyser Git. Utilisation d\'un patch par défaut.');
    return 'patch';
  }
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || detectChangeType();
  
  console.log('🚀 Mise à jour automatique des versions...');
  
  // Charger les configurations
  const appConfig = getAppConfig();
  const packageConfig = getPackageConfig();
  
  // Versions actuelles
  const currentVersion = appConfig.expo.version;
  const currentBuildNumber = appConfig.expo.ios?.buildNumber || 1;
  const currentVersionCode = appConfig.expo.android?.versionCode || 1;
  
  console.log(`📱 Version actuelle: ${currentVersion}`);
  console.log(`🍎 Build iOS actuel: ${currentBuildNumber}`);
  console.log(`🤖 Version Code Android actuel: ${currentVersionCode}`);
  
  // Calculer les nouvelles versions
  const newVersion = incrementVersion(currentVersion, versionType);
  const gitCommitCount = getGitCommitCount();
  const newBuildNumber = Math.max(currentBuildNumber + 1, gitCommitCount);
  const newVersionCode = Math.max(currentVersionCode + 1, gitCommitCount);
  
  // Informations sur les changements (basé sur les fichiers récemment modifiés)
  const changeDate = new Date().toISOString().split('T')[0];
  const buildTag = `${newVersion}-dev.${newBuildNumber}`;
  
  console.log(`\n✨ Nouvelles versions:`);
  console.log(`📱 Version: ${currentVersion} → ${newVersion}`);
  console.log(`🍎 Build iOS: ${currentBuildNumber} → ${newBuildNumber}`);
  console.log(`🤖 Version Code Android: ${currentVersionCode} → ${newVersionCode}`);
  console.log(`🏷️  Tag de build: ${buildTag}`);
  
  // Mettre à jour app.json
  appConfig.expo.version = newVersion;
  if (appConfig.expo.ios) {
    appConfig.expo.ios.buildNumber = newBuildNumber.toString();
  }
  if (appConfig.expo.android) {
    appConfig.expo.android.versionCode = newVersionCode;
  }
  
  // Ajouter des métadonnées de build
  if (!appConfig.expo.extra.buildInfo) {
    appConfig.expo.extra.buildInfo = {};
  }
  
  appConfig.expo.extra.buildInfo = {
    buildDate: new Date().toISOString(),
    buildTag: buildTag,
    changeType: versionType,
    commitCount: gitCommitCount,
    features: [
      'Suivi des temps de travail (conduite, repos, attente)',
      'Statistiques mensuelles et quotidiennes',
      'Interface de saisie intuitive',
      'Agrégation automatique des données',
      'Corrections diverses et améliorations'
    ]
  };
  
  // Mettre à jour package.json
  packageConfig.version = newVersion;
  
  // Sauvegarder les fichiers
  saveAppConfig(appConfig);
  savePackageConfig(packageConfig);
  
  console.log(`\n✅ Versions mises à jour avec succès !`);
  console.log(`📁 Fichiers modifiés: app.json, package.json`);
  
  // Afficher le résumé des fonctionnalités ajoutées
  console.log(`\n📋 Fonctionnalités incluses dans cette version:`);
  appConfig.expo.extra.buildInfo.features.forEach((feature, index) => {
    console.log(`   ${index + 1}. ${feature}`);
  });
  
  console.log(`\n🎯 Prêt pour le build EAS !`);
  console.log(`   Commande suggérée: npm run build:dev`);
  
  return {
    version: newVersion,
    buildNumber: newBuildNumber,
    versionCode: newVersionCode,
    buildTag: buildTag
  };
}

if (require.main === module) {
  main();
}

module.exports = { main, incrementVersion, detectChangeType };
