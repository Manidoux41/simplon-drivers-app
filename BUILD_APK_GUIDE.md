# 📱 BUILD APK SIMPLON DRIVERS

## 🚀 Génération APK en Cours

**Commande lancée :** `npm run build:apk`
**Profil utilisé :** `apk` (spécialement configuré)

### 📋 Spécifications de l'APK

#### Configuration
- **Format** : APK (Android Package)
- **Profil** : apk (distribution interne)
- **Resource Class** : medium (optimisé)
- **Distribution** : internal (test/démo)

#### Assets Intégrés
- ✅ **Logo Simplon** : Icône principale
- ✅ **Splash Screen** : Branding Simplon
- ✅ **Icône Adaptative** : Android moderne
- ✅ **Toutes fonctionnalités** : Cartes + routage

### 🎯 Avantages de l'APK

#### Vs. AAB (App Bundle)
| Caractéristique | APK | AAB |
|------------------|-----|-----|
| **Installation** | ✅ Directe | ❌ Store uniquement |
| **Test rapide** | ✅ Immédiat | ❌ Process store |
| **Démo** | ✅ Parfait | ❌ Compliqué |
| **Taille** | ⚠️ Plus gros | ✅ Optimisé |
| **Store** | ❌ Non recommandé | ✅ Standard |

#### Cas d'Usage APK
- 🧪 **Tests** : Installation directe
- 👥 **Démos** : Partage facile
- 🔍 **Validation** : Vérification rapide
- 📱 **Sideload** : Installation manuelle

### 📱 Après Génération

#### Téléchargement
1. **expo.dev** - Interface web
2. **CLI** : `eas build:list`
3. **Email** : Notification automatique
4. **QR Code** : Scan direct

#### Installation
```bash
# Via ADB (développeurs)
adb install simplon-drivers.apk

# Via partage de fichier
# 1. Télécharger APK sur appareil
# 2. Activer "Sources inconnues"
# 3. Installer directement
```

### 🔒 Sécurité APK

#### Configuration Sécurisée
- ✅ **Signature** : EAS automatique
- ✅ **Permissions** : Localisation uniquement
- ✅ **Distribution** : Internal (limité)
- ✅ **Build reproductible** : EAS traceable

#### Installation Sécurisée
```
⚠️ IMPORTANT ⚠️
Seuls les APKs générés par EAS sont sûrs
- Source : expo.dev officiel
- Signature : Valide EAS
- Build ID : Vérifiable
```

### 📊 Comparaison Builds

#### Build APK (Actuel)
```json
{
  "type": "APK",
  "purpose": "Test/Démo",
  "installation": "Directe",
  "logo": "Simplon intégré",
  "features": "Complètes",
  "size": "~50-80 MB"
}
```

#### Build AAB (Production)
```json
{
  "type": "AAB", 
  "purpose": "Google Play Store",
  "installation": "Store uniquement",
  "logo": "Simplon intégré",
  "features": "Complètes",
  "size": "~30-50 MB (optimisé)"
}
```

### 🎨 Aperçu APK avec Logo Simplon

```
📱 Installation APK          🎭 Premier Lancement
┌─────────────────────┐     ┌─────────────────────┐
│ Installer l'app?    │     │                     │
│ [SIMPLON] Drivers   │     │     [SIMPLON]       │
│ Par: superflyman90  │     │      DRIVERS        │
│                     │     │                     │
│ [Installer] [Annul] │     │  Chargement...      │
└─────────────────────┘     └─────────────────────┘
```

### 🚀 Scripts Disponibles

```bash
# Générer APK
npm run build:apk

# Générer APK preview (développement)
npm run build:preview

# Vérifier status
eas build:list

# Télécharger directement
eas build:view [BUILD_ID] --download
```

### ⏰ Timeline

```
🎬 Démarré : Maintenant
🔧 Compilation : 10-15 minutes
🎨 Assets : Logo Simplon intégré
📱 APK : Prêt à télécharger
✅ Installation : Immédiate après DL
```

### 💡 Utilisation Recommandée

#### Pour Tests
1. **Télécharger** APK depuis expo.dev
2. **Transférer** sur appareil Android
3. **Installer** (autoriser sources inconnues)
4. **Tester** toutes fonctionnalités

#### Pour Démos
1. **Partager** lien APK
2. **QR Code** pour téléchargement rapide
3. **Installation** guidée
4. **Présentation** avec logo Simplon

---

**🎯 APK Simplon Drivers en cours de génération avec logo intégré !**

Format parfait pour tests et démonstrations avec installation directe.
