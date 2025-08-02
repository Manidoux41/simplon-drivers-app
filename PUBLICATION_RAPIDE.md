# 🚀 Soumission Rapide Google Play Store

## ✅ Configuration Terminée !

Votre application est maintenant configurée pour la publication sur Google Play Store.

### 📁 Fichiers configurés :
- ✅ `eas.json` - Configuration build et soumission
- ✅ `app.json` - Métadonnées application
- ✅ `package.json` - Scripts de publication
- ✅ `PRIVACY_POLICY.md` - Politique de confidentialité
- ✅ `publish-android.sh` - Script automatisé

## 🚀 Publication en 3 étapes :

### 1. Build de production
```bash
# Option A: Script automatisé (recommandé)
./publish-android.sh

# Option B: Commande directe
npm run build:production:android
```

### 2. Soumission automatique
```bash
# Si vous avez configuré Google Service Account
npm run submit:android

# Ou tout en une fois
npm run publish:android
```

### 3. Soumission manuelle (alternative)
1. Télécharger le fichier AAB depuis [expo.dev](https://expo.dev)
2. Aller sur [Google Play Console](https://play.google.com/console)
3. Créer nouvelle app ou version
4. Télécharger le fichier AAB

## 📝 Informations requises pour le store :

### Métadonnées de base :
- **Nom** : Simplon Drivers
- **Description** : Voir `PUBLICATION_GOOGLE_PLAY.md`
- **Catégorie** : Outils / Business
- **Classification** : Tout public

### Documents requis :
- **Politique de confidentialité** : Utilisez `PRIVACY_POLICY.md`
- **Captures d'écran** : 2-8 images (1080x1920)
- **Icône** : 512x512 (déjà dans assets/)

## 🔧 Configuration Google Play Console

### 1. Compte développeur
- Inscription : 25$ (unique)
- URL : [play.google.com/console](https://play.google.com/console)

### 2. Nouvelle application
1. "Créer une application"
2. Nom : "Simplon Drivers"
3. Langue : Français
4. Type : Application
5. Gratuite/Payante : À définir

### 3. Configuration store
1. **Fiche du store** : Descriptions, images
2. **Classification du contenu** : Répondre au questionnaire
3. **Politique de confidentialité** : Lien vers votre site
4. **Autorisations d'app** : Vérifier automatiquement

## ⚡ Commandes rapides

```bash
# Build et publication complète
npm run publish:android

# Build seulement
npm run build:production:android

# Soumission seulement (si build existe)
npm run submit:android

# Vérifier status du build
eas build:list

# Activer/désactiver cartes
npm run maps:enable
npm run maps:disable
```

## 📞 Support

- **Documentation complète** : `PUBLICATION_GOOGLE_PLAY.md`
- **Politique de confidentialité** : `PRIVACY_POLICY.md`
- **Guide cartes** : `CARTES_ACTIVEES.md`

---

**🎉 Votre app est prête pour Google Play Store !**

Durée estimée : 2-3 heures (first build) puis 30 minutes pour les updates.
