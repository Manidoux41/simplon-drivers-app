# 🚛 Guide d'Utilisation - Système de Kilométrage Intégré

## Vue d'ensemble

Le système de suivi kilométrique est maintenant **pleinement intégré** dans toutes les pages de missions de l'application Simplon Drivers. Il remplace les boutons basiques "Commencer" et "Terminer" par un workflow intelligent de saisie kilométrique.

## 🎯 Workflow Complet pour les Chauffeurs

### 1. **Page "Mes Missions" (`/missions`)**

#### Indicateurs visuels :
- 📊 **Icône de statut kilométrique** : Visible sur chaque carte de mission
  - ⚪ Gris : Aucun kilométrage enregistré
  - 🟡 Orange : Kilométrage de départ saisi (mission en cours)
  - ✅ Vert : Kilométrage complet (mission terminée)

#### Actions disponibles :
- Clic sur une mission → Accès aux détails avec système kilométrique complet

### 2. **Page Détail Mission (`/mission/[id]`)**

#### Pour missions **EN ATTENTE** (`PENDING`) :
```
┌─ Actions de Kilométrage ─────────────────┐
│  🔵 [Commencer]     🔄 [Terminer]       │
│     ↓ ACTIF           ↓ DÉSACTIVÉ       │
│                                         │
│  📊 Résumé des distances :              │
│  • Distance dépôt → mission : -- km     │
│  • Distance totale : -- km              │
└─────────────────────────────────────────┘
```

**Action "Commencer" :**
1. Ouvre le modal de saisie kilométrique
2. Demande 2 relevés :
   - 🏢 **Kilométrage départ dépôt**
   - 📍 **Kilométrage début mission** (arrivée sur lieu de prise en charge)
3. Validation automatique (début mission > départ dépôt)
4. Calcul et affichage de la distance dépôt → mission
5. **Passage automatique de la mission en statut `IN_PROGRESS`**

#### Pour missions **EN COURS** (`IN_PROGRESS`) :
```
┌─ Actions de Kilométrage ─────────────────┐
│  ✅ [Départ OK]     🔴 [Terminer]       │
│     ↓ TERMINÉ         ↓ ACTIF           │
│                                         │
│  📊 Résumé des distances :              │
│  • Distance dépôt → mission : 25 km     │
│  • Distance totale : -- km              │
└─────────────────────────────────────────┘
```

**Action "Terminer" :**
1. Ouvre le modal de saisie kilométrique
2. Demande 2 relevés :
   - 🏁 **Kilométrage fin mission** (arrivée destination)
   - 🏢 **Kilométrage retour dépôt**
3. Validation automatique (retour dépôt > fin mission > début mission)
4. Calculs automatiques de toutes les distances
5. **Passage automatique de la mission en statut `COMPLETED`**

#### Pour missions **TERMINÉES** (`COMPLETED`) :
```
┌─ Résumé Kilométrique Complet ────────────┐
│  📊 Relevés :                            │
│  🏢 Départ dépôt : 125,000 km           │
│  📍 Début mission : 125,025 km          │
│  🏁 Fin mission : 125,090 km            │
│  🏢 Retour dépôt : 125,115 km           │
│                                         │
│  📏 Distances calculées :               │
│  🎯 Distance mission uniquement : 65 km │
│  🔄 Distance totale (dépôt-dépôt) : 115km│
└─────────────────────────────────────────┘
```

#### Options alternatives :
- Boutons "sans kilométrage" disponibles pour changement de statut direct
- Liens PDF pour export/impression des détails

## 🎛️ Interface Administrateur

### 3. **Page "Toutes les missions" (`/admin/all-missions`)**

#### Indicateurs sur chaque ligne :
- **Icône kilométrique** à côté du titre de mission
- **Badge de statut** coloré selon l'état
- **Menu PDF** pour export administrateur

#### Informations visibles :
```
📋 Mission urgente Paris-Lyon    🟡📊 [En cours]
    Chauffeur: Jean Durand
    Client: Hôpital de Lyon  
    Trajet: Dépôt Paris → Hôpital Lyon
    📅 Programmée: 02/08/2025 14:30
    👥 Passagers: 0/50
    [Voir détails] [📄 PDF] [Supprimer]
```

## 📊 Données Calculées et Stockées

### Base de données (table `missions`) :
```sql
-- Relevés kilométriques
kmDepotStart INTEGER,      -- Ex: 125000
kmMissionStart INTEGER,    -- Ex: 125025  
kmMissionEnd INTEGER,      -- Ex: 125090
kmDepotEnd INTEGER,        -- Ex: 125115

-- Distances calculées automatiquement  
distanceMissionOnly INTEGER,    -- Ex: 65 (125090-125025)
distanceDepotToDepot INTEGER   -- Ex: 115 (125115-125000)
```

### Calculs automatiques :
1. **Distance dépôt → mission** : `kmMissionStart - kmDepotStart`
2. **Distance mission seulement** : `kmMissionEnd - kmMissionStart`  
3. **Distance mission → dépôt** : `kmDepotEnd - kmMissionEnd`
4. **Distance totale** : `kmDepotEnd - kmDepotStart`

## 🔄 États et Transitions

### Workflow automatique :
```
PENDING (En attente)
    ↓ [Saisie kilométrage départ]
IN_PROGRESS (En cours) 
    ↓ [Saisie kilométrage fin]
COMPLETED (Terminée)
```

### Validation des données :
- ✅ Ordre chronologique respecté
- ✅ Valeurs numériques positives
- ✅ Cohérence des relevés
- ✅ Messages d'erreur explicites

## 🚀 Avantages pour l'Entreprise

### Traçabilité complète :
- **Kilométrage précis** pour facturation client
- **Distances réelles** vs estimations
- **Coûts de carburant** calculables automatiquement
- **Usure véhicule** trackée précisément

### Workflow optimisé :
- **Plus de statuts manuels** : Transitions automatiques
- **Validation temps réel** : Pas d'erreurs de saisie
- **Interface unifiée** : Même UX partout dans l'app
- **Données fiables** : Base pour analyses et rapports

## 📱 Points d'Accès Utilisateur

### Chauffeurs :
1. **Liste missions** → Voir statut kilométrique en un coup d'œil
2. **Détail mission** → Saisie guidée avec validation
3. **Export PDF** → Impression avec données kilométriques

### Administrateurs :
1. **Toutes missions** → Vue d'ensemble avec statuts
2. **Détails admin** → Accès complet aux données
3. **Export PDF admin** → Rapports enrichis

---

## 🎉 Résultat Final

**Le système de kilométrage remplace complètement le workflow basique** de changement de statut par un **processus intelligent et automatisé** qui :

✅ **Guide le chauffeur** étape par étape  
✅ **Valide les données** en temps réel  
✅ **Calcule automatiquement** toutes les distances  
✅ **Change les statuts** de manière cohérente  
✅ **Stocke des données précises** pour la gestion  
✅ **Unifie l'expérience** sur toutes les pages  

**Votre application dispose maintenant d'un système de suivi kilométrique professionnel et complet !** 🚛📊
