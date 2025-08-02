# CHANGELOG - Simplon Drivers App

## Version 1.0.2-dev.111 (2 août 2025)

### 🆕 Nouvelles fonctionnalités
- **Suivi des temps de travail** : Les chauffeurs peuvent maintenant saisir leurs temps de conduite, repos et attente
- **Interface de saisie intuitive** : Modal avec sélecteurs heures/minutes pour chaque type de temps
- **Statistiques personnalisées** : Affichage des statistiques mensuelles et quotidiennes dans le profil chauffeur
- **Agrégation automatique** : Calcul automatique des totaux par jour et par mois
- **Intégration missions** : Section dédiée dans les détails de mission pour le suivi des temps

### 🛠️ Améliorations techniques
- Nouvelles colonnes dans la base de données pour stocker les temps de travail
- Table `driver_work_times` pour l'agrégation des données
- Système de migration automatique pour la compatibilité avec les bases existantes
- Composants React optimisés avec gestion d'état stable
- Validation des données saisies et gestion d'erreurs

### 🔧 Corrections
- Résolution des erreurs "Maximum update depth exceeded" dans les composants de route
- Correction du parsing des dates pour l'édition de missions
- Amélioration de la stabilité des boucles de rendu React
- Optimisation des performances avec useCallback et useMemo

### 📊 Base de données
- Ajout des colonnes `drivingTimeMinutes`, `restTimeMinutes`, `waitingTimeMinutes`
- Nouvelle table `driver_work_times` avec index optimisés
- Système de migration automatique et sécurisé
- Support pour les commentaires sur les temps de travail

### 🎯 Interface utilisateur
- Nouveaux composants `MissionTimeTracker` et `WorkTimeStats`
- Navigation mensuelle dans les statistiques
- Affichage formaté des temps (HhMM + décimal)
- Intégration harmonieuse dans l'interface existante

### 🚀 Utilisation
1. **Pour les chauffeurs** : Onglet Mission → "Modifier les temps de travail"
2. **Statistiques** : Onglet Profil → Section "Mes temps de travail"
3. **Navigation** : Flèches pour parcourir les mois dans les statistiques

---

## Versions précédentes

### Version 1.0.1
- Corrections mineures et optimisations

### Version 1.0.0
- Version initiale de l'application
- Gestion des missions et itinéraires
- Suivi kilométrique
- Interface chauffeur et administrateur
