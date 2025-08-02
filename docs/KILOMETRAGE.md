# Système de Suivi Kilométrique

Ce document décrit le système de suivi kilométrique intégré à l'application Simplon Drivers.

## Vue d'ensemble

Le système de kilométrage permet aux chauffeurs de suivre précisément les distances parcourues lors de leurs missions avec 4 points de mesure :

1. **Départ dépôt** (`kmDepotStart`) - Kilométrage au départ du dépôt
2. **Début mission** (`kmMissionStart`) - Kilométrage à l'arrivée sur le lieu de prise en charge
3. **Fin mission** (`kmMissionEnd`) - Kilométrage à l'arrivée sur le lieu de destination
4. **Retour dépôt** (`kmDepotEnd`) - Kilométrage au retour au dépôt

## Calculs automatiques

Le système calcule automatiquement :
- **Distance dépôt → mission** : `kmMissionStart - kmDepotStart`
- **Distance mission uniquement** : `kmMissionEnd - kmMissionStart`
- **Distance mission → dépôt** : `kmDepotEnd - kmMissionEnd`
- **Distance totale (dépôt à dépôt)** : `kmDepotEnd - kmDepotStart`

## Architecture technique

### Services

#### `KilometrageService`
Service principal pour la gestion du kilométrage :

```typescript
// Mise à jour du kilométrage de départ (début de mission)
await KilometrageService.updateStartKilometrage(missionId, kmDepotStart, kmMissionStart);

// Mise à jour du kilométrage de fin (fin de mission)
await KilometrageService.updateEndKilometrage(missionId, kmMissionEnd, kmDepotEnd);

// Validation des données
const isValid = KilometrageService.validateKilometrageData(data);

// Calculs de distances
const calculations = KilometrageService.calculateDistances(data);
```

### Base de données

#### Extensions de la table `missions`
```sql
-- Nouveaux champs ajoutés à la table missions
kmDepotStart INTEGER,           -- Kilométrage départ dépôt
kmMissionStart INTEGER,         -- Kilométrage début mission
kmMissionEnd INTEGER,           -- Kilométrage fin mission
kmDepotEnd INTEGER,             -- Kilométrage retour dépôt
distanceDepotToDepot INTEGER,   -- Distance totale calculée
distanceMissionOnly INTEGER     -- Distance mission uniquement
```

### Composants UI

#### `KilometrageInput`
Composant modal pour la saisie du kilométrage avec validation en temps réel.

**Props :**
- `missionId` : ID de la mission
- `phase` : `'start' | 'end'` - Phase de saisie
- `onSuccess` : Callback après saisie réussie
- `onCancel` : Callback d'annulation

#### `KilometrageActions`
Composant d'actions groupées avec boutons "Commencer" et "Terminer".

**Fonctionnalités :**
- Gestion des états (pas commencé, en cours, terminé)
- Résumé des distances en temps réel
- Validation automatique des transitions

#### `KilometrageSummary`
Affichage détaillé du kilométrage avec tous les relevés et calculs.

**Fonctionnalités :**
- Affichage des 4 points de mesure
- Distances calculées avec codes couleur
- Badge de statut (complet/incomplet)

#### `KilometrageButton`
Bouton intelligent qui s'adapte à l'état de la mission.

**États :**
- 🔵 "Commencer mission" - Aucune donnée
- 🔴 "Terminer mission" - Données de départ saisies
- ✅ "Kilométrage complet" - Toutes les données saisies

#### `KilometrageStatusIcon`
Icône de statut pour l'affichage dans les listes.

## Utilisation

### Intégration dans une page de mission

```tsx
import { 
  KilometrageActions,
  KilometrageSummary,
  KilometrageButton 
} from '../components';

function MissionDetail({ mission }) {
  const handleMissionUpdate = async (missionId) => {
    // Recharger les données de la mission
    await loadMission();
  };

  return (
    <View>
      {/* Actions principales */}
      <KilometrageActions
        mission={mission}
        onUpdate={handleMissionUpdate}
        showSummary={true}
      />

      {/* Résumé détaillé */}
      <KilometrageSummary
        mission={mission}
        showEditButton={true}
        onEdit={() => {/* Ouvrir modification */}}
      />

      {/* Bouton simple */}
      <KilometrageButton
        mission={mission}
        onUpdate={handleMissionUpdate}
      />
    </View>
  );
}
```

### Workflow type

1. **Début de mission :**
   - Chauffeur part du dépôt → note le kilométrage
   - Arrive sur lieu de prise en charge → note le kilométrage
   - Validation automatique (mission start > depot start)

2. **Fin de mission :**
   - Arrive sur lieu de destination → note le kilométrage
   - Retour au dépôt → note le kilométrage
   - Validation automatique (depot end > mission end > mission start)

3. **Calculs automatiques :**
   - Toutes les distances sont calculées et sauvegardées
   - Disponibles pour facturation, rapports, statistiques

## Validation et sécurité

### Règles de validation
- Tous les kilométrages doivent être des nombres positifs
- Ordre chronologique respecté : `kmDepotStart ≤ kmMissionStart ≤ kmMissionEnd ≤ kmDepotEnd`
- Distances minimales et maximales configurables
- Validation côté client et serveur

### Gestion d'erreurs
- Messages d'erreur explicites pour l'utilisateur
- Validation en temps réel pendant la saisie
- Sauvegarde atomique (tout ou rien)

## Extensions futures

- **Export des données** : PDF, Excel avec détails kilométriques
- **Statistiques** : Moyennes, tendances, comparaisons
- **Géolocalisation** : Vérification automatique des positions
- **Photos** : Capture du compteur kilométrique
- **Historique** : Suivi des modifications avec horodatage

## Performance

- Calculs effectués côté client pour réactivité
- Sauvegarde en base uniquement lors de validation
- Optimisation des requêtes avec indexes sur les colonnes kilométriques
- Cache des calculs pour éviter les recalculs inutiles
