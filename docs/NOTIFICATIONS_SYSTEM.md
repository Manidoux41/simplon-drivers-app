# 🔔 Guide du Système de Notifications

## Vue d'ensemble

Le système de notifications permet d'informer automatiquement les chauffeurs lorsque :
- Une mission leur est assignée
- Une mission leur est retirée  
- Une mission qui leur est assignée est modifiée

## Architecture

### Services
- **NotificationService** : Gère la création et le stockage des notifications
- **MissionEventBus** : Système d'événements pour la synchronisation en temps réel
- **DatabaseService** : Intégration des notifications lors des mises à jour de missions

### Composants UI
- **NotificationBell** : Cloche de notifications dans l'en-tête avec badge de comptage
- Intégration dans tous les onglets via le layout principal

## Fonctionnement

### 1. Assignation de Mission
Quand un administrateur assigne une mission à un chauffeur :
```typescript
// Dans updateMission (database.ts)
await notificationService.notifyMissionAssigned(newDriverId, mission);
```

### 2. Suppression d'Assignation
Quand une mission est retirée d'un chauffeur :
```typescript
await notificationService.notifyMissionRemoved(oldDriverId, mission);
```

### 3. Modification de Mission
Quand les détails d'une mission assignée changent :
```typescript
await notificationService.notifyMissionUpdated(driverId, mission, changes);
```

### 4. Synchronisation Temps Réel
L'Event Bus assure que les listes de missions se mettent à jour automatiquement :
```typescript
// Dans useMissions-local.ts
useEffect(() => {
  const handleMissionChange = () => {
    loadMissions();
  };
  
  missionEventBus.subscribe(handleMissionChange);
  return () => missionEventBus.unsubscribe(handleMissionChange);
}, [loadMissions]);
```

## Interface Utilisateur

### Cloche de Notifications
- **Badge rouge** : Indique le nombre de notifications non lues
- **Modal** : Liste toutes les notifications avec possibilité de les marquer comme lues
- **Auto-refresh** : Se met à jour automatiquement quand de nouvelles notifications arrivent

### Types de Notifications
1. **Mission Assignée** (🚚) : "Une nouvelle mission vous a été assignée"
2. **Mission Supprimée** (❌) : "Une mission vous a été retirée"  
3. **Mission Modifiée** (📝) : "Une de vos missions a été modifiée"

## Points d'Intégration

### Pour Administrateurs
Les actions suivantes déclenchent automatiquement des notifications :
- Modification du chauffeur assigné dans `/admin/edit-mission/[id]`
- Changements d'état ou de détails de mission
- Suppression d'assignation

### Pour Chauffeurs
- Notifications visibles dans tous les onglets (cloche en en-tête)
- Mise à jour automatique des listes de missions
- Accès facile aux détails des nouvelles missions assignées

## Base de Données

### Table notifications
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  mission_id TEXT,
  timestamp INTEGER NOT NULL,
  read INTEGER NOT NULL DEFAULT 0
);
```

## Tests

Un fichier de test est disponible : `/test/notification-test.ts`
- Tests unitaires du service de notifications
- Vérification de l'Event Bus
- Tests d'intégration complète

## Bonnes Pratiques

1. **Ne pas spam** : Les notifications ne se déclenchent que lors de vrais changements
2. **Contexte clair** : Chaque notification contient le nom de la mission et du client
3. **Actions rapides** : Liens directs vers les détails de la mission
4. **Nettoyage** : Possibilité de marquer comme lu pour maintenir une interface propre

## Évolutions Futures

- Notifications push natives (avec Expo Notifications)
- Filtres par type de notification
- Historique des notifications avec dates
- Paramètres de notification par utilisateur