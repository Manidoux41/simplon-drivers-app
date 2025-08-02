# 📋 Configuration Service Account Google - Guide Détaillé

## 🎯 Option 1: Soumission Automatique (Recommandée)

### Étape 1: Créer le Service Account Google
1. **Allez sur [Google Cloud Console](https://console.cloud.google.com/)**
2. **Créez un nouveau projet ou sélectionnez existant**
   - Nom suggéré : "Simplon Drivers App"
3. **Activez l'API Google Play Android Developer**
   - APIs & Services > Library
   - Rechercher "Google Play Android Developer API"
   - Cliquer "Enable"

### Étape 2: Créer le Compte de Service
1. **IAM & Admin > Comptes de service**
2. **Créer un compte de service**
   - Nom : "simplon-drivers-publisher"
   - Description : "Service account pour publication Simplon Drivers"
3. **Attribuer le rôle** : "Service Account User"
4. **Créer et télécharger la clé JSON**
   - Dans le compte de service créé
   - Onglet "Clés" > "Ajouter une clé" > "Créer une nouvelle clé"
   - Format : JSON
   - **Télécharger le fichier**

### Étape 3: Renommer et Placer le Fichier
```bash
# Renommer le fichier téléchargé
# De : project-name-123456-abc123def456.json
# À :   google-service-account.json

# Placer à la racine du projet
mv ~/Downloads/project-name-*.json ./google-service-account.json
```

### Étape 4: Configurer Google Play Console
1. **Google Play Console > Paramètres > Accès aux API**
2. **Lier votre projet Google Cloud**
3. **Accorder permissions au compte de service**
   - Ajouter le compte de service
   - Permissions : "Gérer les versions et modifier les fiches Play Store"

### Étape 5: Path pour EAS
```
Path to Google Service Account file: ./google-service-account.json
```

---

## 🎯 Option 2: Soumission Manuelle (Plus Simple)

Si vous préférez télécharger manuellement le fichier AAB sur Google Play Console :

### Configuration EAS
```
Path to Google Service Account file: [Laisser vide ou appuyer Entrée]
```

### Processus Manuel
1. **Télécharger le AAB** depuis expo.dev
2. **Aller sur Google Play Console**
3. **Créer une nouvelle app**
4. **Télécharger le fichier AAB** dans "Version de production"

---

## 📋 Checklist de Configuration

### Pour Soumission Automatique
- [ ] Projet Google Cloud créé
- [ ] API Google Play Android Developer activée
- [ ] Service Account créé avec permissions
- [ ] Fichier JSON téléchargé et renommé
- [ ] Fichier placé : `./google-service-account.json`
- [ ] Google Play Console configuré
- [ ] Permissions accordées au service account

### Pour Soumission Manuelle
- [ ] Aucune configuration requise
- [ ] Juste laisser le path vide

---

## 🚀 Commandes Après Configuration

### Avec Service Account (Automatique)
```bash
# Build et soumission automatique
npm run publish:android

# Ou séparément
npm run build:production:android
npm run submit:android
```

### Sans Service Account (Manuel)
```bash
# Build seulement
npm run build:production:android

# Puis télécharger depuis expo.dev
# Et uploader manuellement sur Google Play Console
```

---

## ⚠️ Sécurité

### Fichier Service Account
- **NE PAS** commiter `google-service-account.json` dans Git
- **Ajouter** au `.gitignore` :
```
google-service-account.json
*.json
```

### Variables d'Environnement (Alternative)
Au lieu d'un fichier, vous pouvez utiliser des variables d'environnement :
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY="contenu_du_fichier_json"
```

---

## 🎯 Recommandation

**Pour votre première publication** : Utilisez la **soumission manuelle** (Option 2)
- Plus simple à configurer
- Moins de risques d'erreur
- Vous pouvez configurer l'automatique plus tard

**Pour les futures mises à jour** : Configurez la **soumission automatique** (Option 1)
- Gain de temps considérable
- Processus plus fluide
- Intégration CI/CD possible
