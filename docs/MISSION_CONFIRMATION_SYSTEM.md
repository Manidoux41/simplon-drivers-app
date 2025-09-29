# 🔔 Système de Confirmation de Missions

## Vue d'ensemble

Le système de confirmation de missions permet aux chauffeurs d'accepter ou de refuser les missions qui leur sont proposées, offrant plus de flexibilité et de contrôle dans l'assignation des missions.

## Fonctionnement

### 1. Processus d'Assignation avec Confirmation

Quand un administrateur assigne une mission à un chauffeur :

1. **Proposition de mission** : La mission passe en statut `PENDING` 
2. **Notification de confirmation** : Le chauffeur reçoit une notification `MISSION_PENDING_CONFIRMATION`
3. **Choix du chauffeur** : Le chauffeur peut accepter ou refuser via l'interface
4. **Traitement de la réponse** :
   - ✅ **Acceptée** : Mission passe en statut `ASSIGNED` 
   - ❌ **Refusée** : Mission revient en statut `PENDING` sans chauffeur

### 2. Interface Utilisateur

#### Pour les Chauffeurs
- **Cloche de notifications** : Affiche les demandes de confirmation avec badge orange
- **Carte de confirmation** : Interface détaillée avec informations mission et boutons d'action
- **Actions disponibles** :
  - `Accepter` : Confirme l'assignation
  - `Refuser` : Décline la mission

#### Pour les Administrateurs  
- **Notification de refus** : Alerte automatique quand une mission est refusée
- **Gestion des missions** : Visibilité sur les missions en attente de confirmation

## Architecture Technique

### Nouveaux Types de Notifications
```typescript
type NotificationTypes = 
  | 'MISSION_PENDING_CONFIRMATION'  // Demande de confirmation au chauffeur
  | 'MISSION_ACCEPTED'             // Confirmation d'acceptation
  | 'MISSION_REFUSED'              // Notification de refus aux admins
```

### Statuts de Mission
```typescript
type MissionStatus = 
  | 'PENDING'      // En attente (non assignée ou en attente de confirmation)
  | 'ASSIGNED'     // Confirmée et assignée
  | 'IN_PROGRESS'  // En cours
  | 'COMPLETED'    // Terminée
  | 'CANCELLED'    // Annulée
```

### Base de Données

#### Table notifications (étendue)
```sql
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  missionId TEXT,
  missionTitle TEXT,
  isRead INTEGER DEFAULT 0,
  requiresAction INTEGER DEFAULT 0,  -- Nouvelle colonne pour les actions
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Composants

### MissionConfirmationCard
Interface de confirmation avec :
- **Détails de mission** : Lieu départ/arrivée, horaires, passagers
- **Boutons d'action** : Accepter (vert) / Refuser (rouge)
- **Gestion d'état** : Loading states pendant le traitement

### NotificationBell (étendue)
- Support des notifications avec actions
- Rendu conditionnel pour les confirmations
- Badge de comptage des notifications non lues

### Hooks

#### useNotifications
```typescript
const {
  notifications,
  unreadCount,
  pendingConfirmations,
  markAsRead,
  loadNotifications
} = useNotifications();
```

#### useMissions (étendu)
```typescript
const {
  acceptMission,
  refuseMission,
  getPendingConfirmationMissions
} = useMissions();
```

## Flux de Données

### Assignation de Mission
```
1. Admin assigne mission → driverId
2. updateMission() détecte changement de chauffeur
3. handleMissionUpdateNotifications() 
4. notifyMissionPendingConfirmation()
5. Notification stockée en base
6. Chauffeur reçoit notification temps réel
```

### Acceptation de Mission
```
1. Chauffeur clique "Accepter"
2. MissionConfirmationCard.handleAccept()
3. updateMission(status: 'ASSIGNED')
4. notifyMissionAccepted()
5. Mission confirmée et assignée
```

### Refus de Mission
```
1. Chauffeur clique "Refuser"
2. MissionConfirmationCard.handleRefuse()
3. updateMission(driverId: '', status: 'PENDING')
4. notifyMissionRefused() → Admins
5. Mission disponible pour réassignation
```

## Avantages

### Pour les Chauffeurs
- ✅ Contrôle sur leurs missions
- ✅ Visibilité complète des détails avant acceptation
- ✅ Pas de missions forcées
- ✅ Interface intuitive

### Pour les Administrateurs
- ✅ Feedback immédiat sur les refus
- ✅ Meilleure gestion de la disponibilité
- ✅ Réduction des conflits
- ✅ Traçabilité des décisions

### Pour l'Application
- ✅ Amélioration de l'expérience utilisateur
- ✅ Réduction des missions non effectuées
- ✅ Meilleure communication
- ✅ Système évolutif

## Configuration

### Notifications Push (Futur)
Le système est prêt pour intégrer les notifications push natives :
```typescript
// Prêt pour Expo Notifications
import * as Notifications from 'expo-notifications';

Notifications.scheduleNotificationAsync({
  content: {
    title: notification.title,
    body: notification.message,
    data: { missionId: notification.missionId }
  },
  trigger: null
});
```

### Paramètres Personnalisables
- Délai d'expiration des confirmations
- Rappels automatiques
- Notifications par type d'utilisateur
- Règles métier par rôle

## Tests

### Cas d'Usage Principaux
1. **Assignation normale** : Admin → Chauffeur → Acceptation → Mission assignée
2. **Refus de mission** : Admin → Chauffeur → Refus → Notification admin
3. **Missions multiples** : Plusieurs demandes simultanées
4. **Reconnexion** : Persistance des notifications après déconnexion

### Scénarios d'Erreur
- Chauffeur introuvable
- Mission supprimée pendant confirmation
- Problèmes de réseau
- Base de données indisponible

## Migration

Pour activer le système sur une installation existante :
1. Mise à jour de la base de données (table notifications)
2. Redémarrage de l'application
3. Les nouvelles assignations utilisent automatiquement la confirmation
4. Les missions existantes restent inchangées

## Performance

- **Notifications temps réel** : Event Bus pour synchronisation immédiate
- **Base de données** : Index sur userId pour requêtes rapides
- **Interface** : Composants optimisés avec states de loading
- **Mémoire** : Gestion automatique des listeners

---

Le système de confirmation transforme l'assignation de missions d'un processus unidirectionnel en dialogue interactif, améliorant significativement l'expérience utilisateur et l'efficacité opérationnelle.