/**
 * Documentation de la fonctionnalité d'optimisation d'itinéraire pour poids lourds
 * 
 * Cette fonctionnalité permet de calculer des itinéraires optimisés spécialement
 * pour les véhicules de plus de 19 tonnes en tenant compte des restrictions
 * de circulation, des limitations de poids et de hauteur.
 */

## Fonctionnalités Implémentées

### 1. Service d'Optimisation d'Itinéraire (HeavyVehicleRouteService)

**Localisation**: `services/HeavyVehicleRouteService.ts`

**Capacités**:
- ✅ Support véhicules de plus de 19 tonnes
- ✅ Restrictions de poids, hauteur, largeur, longueur
- ✅ Évitement des routes interdites aux poids lourds
- ✅ Calcul des péages
- ✅ Détection des tunnels et ponts avec restrictions
- ✅ Support matières dangereuses (hazmat)

**APIs Supportées**:
1. **HERE Maps** (Recommandé) - Spécialisé poids lourds
2. **OpenRouteService** - Fallback avec support HGV
3. **Google Maps** - Fallback basique avec avertissements

### 2. Interface Utilisateur

**Localisation**: `app/admin/create-mission.tsx`

**Éléments ajoutés**:
- ✅ Bouton "Optimiser l'itinéraire (Poids Lourds)"
- ✅ Détection automatique des véhicules > 19t
- ✅ Modal détaillée avec informations complètes
- ✅ Avertissements et restrictions
- ✅ Calcul des péages
- ✅ Instructions de navigation

### 3. Détection Automatique

Le système détecte automatiquement si un véhicule nécessite un routage spécialisé :

```typescript
// Détection basée sur le poids du véhicule
if (heavyVehicleRouteService.isHeavyVehicle(selectedVehicle)) {
  // Optimisation automatique pour poids lourds
} else {
  // Alerte à l'utilisateur si nécessaire
}
```

### 4. Configuration des Véhicules

Le système extrait automatiquement les caractéristiques du véhicule :
- Poids total (GVW)
- Hauteur
- Largeur 
- Longueur
- Charge par essieu
- Transport matières dangereuses

## Workflow d'Utilisation

### Étape 1: Sélection du Véhicule
L'administrateur sélectionne un véhicule de plus de 19 tonnes dans la création de mission.

### Étape 2: Définition des Adresses
Sélection des adresses de départ et destination avec géolocalisation précise.

### Étape 3: Optimisation
Clic sur "Optimiser l'itinéraire (Poids Lourds)" déclenche :
1. Validation des données véhicule
2. Appel aux services de routage spécialisés
3. Calcul avec restrictions poids lourds
4. Affichage des résultats avec avertissements

### Étape 4: Vérification
Modal détaillée affichant :
- Distance et durée optimisées
- Restrictions détectées
- Coûts de péages
- Instructions de navigation
- Avertissements spéciaux

## Exemples de Restrictions Détectées

### Restrictions de Poids
- ⚠️ Poids de 38t supérieur à la limite standard de 44t
- 🔴 ATTENTION: Poids exceptionnel (>40t) - Autorisation spéciale requise

### Restrictions de Hauteur
- ⚠️ Hauteur de 4.2m pouvant poser problème sous certains ponts
- 🔴 ATTENTION: Hauteur exceptionnelle (>4m) - Vérifiez les ponts

### Restrictions d'Infrastructure
- 🚫 Tunnel interdit aux véhicules > 19t
- 🚫 Pont avec limitation de charge
- ⚠️ Route déconseillée pour poids lourds

## Configuration Environnement

Variables d'environnement requises dans `.env` :

```bash
# APIs de routage (optionnelles - fallback disponible)
EXPO_PUBLIC_HERE_API_KEY=your_here_api_key
EXPO_PUBLIC_OPENROUTE_API_KEY=your_openroute_api_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Avantages

### Pour les Chauffeurs
- ✅ Itinéraires sûrs et légaux
- ✅ Évitement des contraventions
- ✅ Estimation précise des péages
- ✅ Temps de trajet optimisés

### Pour les Administrateurs
- ✅ Planification plus précise
- ✅ Réduction des risques
- ✅ Optimisation des coûts
- ✅ Conformité réglementaire

### Pour l'Entreprise
- ✅ Réduction des amendes
- ✅ Optimisation du carburant
- ✅ Amélioration de la sécurité
- ✅ Satisfaction client

## Intégration avec le Système Existant

La fonctionnalité s'intègre parfaitement :
- ✅ Compatible avec le système de missions existant
- ✅ Utilise les données véhicules existantes
- ✅ S'active automatiquement pour les poids lourds
- ✅ Fallback vers le routage standard si nécessaire

## Messages d'Exemple

### Succès
```
"Itinéraire optimisé
Itinéraire calculé spécialement pour votre véhicule de 32t.

Distance: 145.3 km
Durée: 158 min

⚠️ Vérifiez les avertissements"
```

### Avertissements
```
"⚠️ ATTENTION: Poids exceptionnel (>40t) - Autorisation spéciale requise
⚠️ ATTENTION: Hauteur exceptionnelle (>4m) - Vérifiez les ponts
• Éviter le tunnel sous la Manche
• Route avec péage: 45.50 EUR"
```

Cette fonctionnalité transforme la création de mission en un outil professionnel adapté au transport routier de marchandises, avec une attention particulière aux contraintes réglementaires et techniques des poids lourds.