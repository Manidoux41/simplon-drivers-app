# # Simplon Drivers App

Application mobile React Native avec Expo 53 pour la gestion des missions de conducteurs de cars pour la société Cars Simplon.

## � Fonctionnalités

- **Authentification sécurisée** avec Supabase
- **Tableau de bord** avec missions en cours et à venir
- **Gestion des missions** (départ, arrivée, statuts)
- **Historique des missions** complétées
- **Cartes interactives** avec itinéraires
- **Profil conducteur** avec informations personnelles
- **Design personnalisé** aux couleurs Cars Simplon

## 🛠 Technologies Utilisées

- **React Native** avec Expo 53
- **TypeScript** pour la sécurité des types
- **Supabase** pour l'authentification et la base de données
- **Prisma** comme ORM
- **React Navigation** avec Expo Router
- **Expo Location** pour la géolocalisation
- **React Native Maps** pour les cartes

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Compte Supabase (gratuit)
- Expo CLI ou Expo Go sur mobile

## 🚦 Installation et Configuration

### 1. Cloner et installer les dépendances

```bash
cd simplon-drivers-app
npm install
```

### 2. Configuration Supabase

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Dans votre projet Supabase, allez dans Settings > API
4. Copiez l'URL du projet et la clé API (anon/public)
5. Mettez à jour le fichier `.env` avec vos informations :

```env
EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
DATABASE_URL="postgresql://postgres:[VOTRE-MOT-DE-PASSE]@db.[VOTRE-REF].supabase.co:5432/postgres"
```

### 3. Configuration de la base de données

1. Dans votre projet Supabase, allez dans l'éditeur SQL
2. Exécutez le script `database-setup.sql` pour créer les tables et les politiques RLS
3. Exécutez le script `test-data.sql` pour insérer des données de test

### 4. Génération du client Prisma

```bash
npx prisma generate
```

### 5. Lancement de l'application

```bash
npm start
```

Ou spécifiquement pour une plateforme :

```bash
npm run android  # Pour Android
npm run ios      # Pour iOS
npm run web      # Pour le web
```

## 📱 Utilisation

### Connexion

L'application nécessite une authentification. Utilisez les comptes de test :

**Conducteur de test :**
- Email: `jean.durand@carssimplon.fr`
- Mot de passe: Défini dans Supabase Auth

**Administrateur :**
- Email: `admin@carssimplon.fr`
- Mot de passe: Défini dans Supabase Auth

> **Note**: Les utilisateurs doivent être créés manuellement par un administrateur via l'interface Supabase Auth.

### Navigation

L'application comprend 4 onglets principaux :

1. **Tableau de bord** - Vue d'ensemble des missions
2. **Missions** - Liste complète des missions à venir
3. **Historique** - Missions terminées
4. **Profil** - Informations du conducteur

## 🔧 Structure du Projet

```
simplon-drivers-app/
├── app/                     # Pages et navigation (Expo Router)
│   ├── (auth)/             # Pages d'authentification
│   ├── (tabs)/             # Pages principales avec onglets
│   ├── mission/            # Détails des missions
│   ├── _layout.tsx         # Layout principal
│   └── index.tsx           # Page d'accueil
├── components/             # Composants réutilisables
│   └── ui/                 # Composants UI de base
├── hooks/                  # Hooks personnalisés
├── lib/                    # Services et utilitaires
├── utils/                  # Fonctions utilitaires
├── constants/              # Constantes et configuration
└── prisma/                 # Schéma de base de données
```

## 🎨 Design et Couleurs

L'application utilise une palette de couleurs inspirée du logo Cars Simplon :

- **Rouge principal** : `#C41E3A` (rouge Simplon)
- **Gris anthracite** : `#2C3E50` (couleur secondaire)
- **Bleu confiance** : `#3498DB` (accent)
- **Couleurs de statut** : Vert (succès), Orange (attention), Rouge (erreur)

## 🔒 Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- **Authentification JWT** via Supabase
- **Stockage sécurisé** des tokens avec Expo SecureStore
- **Politiques d'accès** strictes par rôle (Admin/Conducteur)

## 📊 Base de Données

### Tables principales :

- **users** - Informations des conducteurs et administrateurs
- **companies** - Entreprises clientes
- **missions** - Détails des trajets et missions

### Relations :

- Un conducteur peut avoir plusieurs missions
- Une mission appartient à un conducteur et une entreprise
- Politiques RLS pour sécuriser l'accès aux données

## 🚀 Déploiement

### Build pour production

```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

### Configuration pour les stores

1. Configurez les icônes et splash screens dans `app.json`
2. Ajustez les permissions dans `app.json`
3. Configurez les variables d'environnement de production

## 🧪 Tests et Données de Demo

L'application inclut des données de test avec :

- 3 conducteurs de test
- 4 entreprises clientes
- 6 missions d'exemple (en cours, à venir, terminées)

## 📞 Support

Pour toute question ou problème :

- Email : support@carssimplon.fr
- Créez une issue sur le repository Git

## 📝 Licence

© 2025 Cars Simplon. Tous droits réservés.

---

## 🔄 Prochaines Étapes

Pour compléter l'application, vous pourriez ajouter :

1. **Notifications push** pour les nouvelles missions
2. **Mode hors ligne** avec synchronisation
3. **Chat** entre conducteurs et dispatchers  
4. **Signature électronique** pour les bons de transport
5. **Rapports** et statistiques détaillées
6. **Intégration GPS** temps réel
7. **Photos** des véhicules et incidents

L'architecture modulaire permet d'ajouter facilement ces fonctionnalités.
