import { Mission } from '../lib/database';
import { databaseService } from '../lib/database';

export interface KilometragePhaseData {
  // Phase 1: Départ de mission (démarrage)
  kmDepotStart?: number;
  
  // Phase 2: Début mission (en cours)
  kmMissionStart?: number;
  
  // Phase 3: Fin mission (complétion)
  kmMissionEnd?: number;
  kmDepotEnd?: number;
}

export interface KilometrageCalculations {
  distanceDepotToMission: number;  // Dépôt → lieu prise en charge
  distanceMissionOnly: number;     // Prise en charge → destination
  distanceMissionToDepot: number;  // Destination → dépôt
  distanceDepotToDepot: number;    // Total dépôt à dépôt
}

export class KilometrageServiceV2 {
  
  /**
   * Récupère le kilométrage actuel du véhicule assigné à une mission
   */
  static async getCurrentVehicleMileage(missionId: string): Promise<number | null> {
    try {
      const mission = await databaseService.getMissionById(missionId);
      if (!mission?.vehicleId) {
        console.warn('Mission sans véhicule assigné');
        return null;
      }

      const vehicle = await databaseService.getVehicleById(mission.vehicleId);
      if (!vehicle) {
        console.warn('Véhicule introuvable');
        return null;
      }

      return vehicle.mileage;
    } catch (error) {
      console.error('Erreur récupération kilométrage véhicule:', error);
      return null;
    }
  }

  /**
   * PHASE 1: Démarre une mission avec le kilométrage de départ du dépôt
   * - Change automatiquement le statut en IN_PROGRESS
   * - Met à jour le kilométrage du véhicule de la flotte
   */
  static async startMissionWithDepotKm(missionId: string, kmDepotStart: number): Promise<void> {
    try {
      // Récupérer la mission pour avoir l'ID du véhicule
      const mission = await databaseService.getMissionById(missionId);
      if (!mission) {
        throw new Error('Mission introuvable');
      }

      if (mission.status !== 'PENDING') {
        throw new Error('Seules les missions en attente peuvent être démarrées');
      }

      // Validation du kilométrage
      if (isNaN(kmDepotStart) || kmDepotStart < 0) {
        throw new Error('Le kilométrage de départ doit être un nombre positif');
      }

      // Si un véhicule est assigné, vérifier la cohérence
      let vehicleInfo = null;
      if (mission.vehicleId) {
        vehicleInfo = await databaseService.getVehicleById(mission.vehicleId);
        if (vehicleInfo && vehicleInfo.mileage > kmDepotStart) {
          throw new Error(
            `Le kilométrage saisi (${kmDepotStart.toLocaleString()} km) est inférieur au kilométrage actuel du véhicule ${vehicleInfo.brand} ${vehicleInfo.model} (${vehicleInfo.mileage.toLocaleString()} km)`
          );
        }
      }

      // Mettre à jour la mission: kilométrage + statut + heure de départ réelle
      const updateData = {
        kmDepotStart,
        status: 'IN_PROGRESS' as const,
        actualDepartureAt: new Date().toISOString()
      };

      await databaseService.updateMission(missionId, updateData);

      // Mettre à jour le kilométrage du véhicule de la flotte
      if (mission.vehicleId) {
        await databaseService.updateVehicleMileage(mission.vehicleId, kmDepotStart);
        console.log(`✅ Véhicule ${mission.vehicleId} mis à jour: ${kmDepotStart.toLocaleString()} km`);
      }

      console.log(`✅ Mission ${missionId} démarrée avec kilométrage dépôt: ${kmDepotStart.toLocaleString()} km`);

    } catch (error: any) {
      console.error('Erreur démarrage mission:', error);
      throw new Error(`Impossible de démarrer la mission: ${error.message}`);
    }
  }

  /**
   * PHASE 2: Ajoute le kilométrage de début de mission (arrivée sur lieu de prise en charge)
   * - Mission doit être IN_PROGRESS avec kmDepotStart déjà saisi
   * - Met à jour le kilométrage du véhicule
   */
  static async addMissionStartKm(missionId: string, kmMissionStart: number): Promise<void> {
    try {
      // Récupérer la mission actuelle
      const mission = await databaseService.getMissionById(missionId);
      if (!mission) {
        throw new Error('Mission introuvable');
      }

      if (mission.status !== 'IN_PROGRESS') {
        throw new Error('La mission doit être en cours pour ajouter le kilométrage de début');
      }

      if (!mission.kmDepotStart) {
        throw new Error('Le kilométrage de départ du dépôt doit être saisi en premier');
      }

      // Validation
      if (isNaN(kmMissionStart) || kmMissionStart < 0) {
        throw new Error('Le kilométrage de début de mission doit être un nombre positif');
      }

      if (kmMissionStart < mission.kmDepotStart) {
        throw new Error(
          `Le kilométrage de début de mission (${kmMissionStart.toLocaleString()} km) ne peut pas être inférieur au kilométrage de départ du dépôt (${mission.kmDepotStart.toLocaleString()} km)`
        );
      }

      // Calculer la distance dépôt → lieu de prise en charge
      const distanceDepotToMission = kmMissionStart - mission.kmDepotStart;

      // Mettre à jour la mission
      const updateData = {
        kmMissionStart,
        distanceDepotToMission
      };

      await databaseService.updateMission(missionId, updateData);

      // Mettre à jour le kilométrage du véhicule
      if (mission.vehicleId) {
        await databaseService.updateVehicleMileage(mission.vehicleId, kmMissionStart);
        console.log(`✅ Véhicule ${mission.vehicleId} mis à jour: ${kmMissionStart.toLocaleString()} km`);
      }

      console.log(`✅ Kilométrage début mission ajouté: ${kmMissionStart.toLocaleString()} km (distance dépôt→mission: ${distanceDepotToMission} km)`);

    } catch (error: any) {
      console.error('Erreur ajout kilométrage début:', error);
      throw new Error(`Impossible d'ajouter le kilométrage de début: ${error.message}`);
    }
  }

  /**
   * PHASE 3: Termine la mission avec les kilométrages de fin
   * - Change automatiquement le statut en COMPLETED
   * - Met à jour le kilométrage final du véhicule
   * - Calcule toutes les distances finales
   */
  static async completeMissionWithKm(missionId: string, kmMissionEnd: number, kmDepotEnd: number): Promise<void> {
    try {
      // Récupérer la mission actuelle
      const mission = await databaseService.getMissionById(missionId);
      if (!mission) {
        throw new Error('Mission introuvable');
      }

      if (mission.status !== 'IN_PROGRESS') {
        throw new Error('La mission doit être en cours pour être terminée');
      }

      if (!mission.kmDepotStart) {
        throw new Error('Le kilométrage de départ du dépôt doit être saisi');
      }

      // Validation des kilométrages de fin
      if (isNaN(kmMissionEnd) || kmMissionEnd < 0 || isNaN(kmDepotEnd) || kmDepotEnd < 0) {
        throw new Error('Les kilométrages de fin doivent être des nombres positifs');
      }

      // Validation de l'ordre chronologique
      if (kmMissionEnd < mission.kmDepotStart) {
        throw new Error(
          `Le kilométrage de fin de mission (${kmMissionEnd.toLocaleString()} km) ne peut pas être inférieur au kilométrage de départ du dépôt (${mission.kmDepotStart.toLocaleString()} km)`
        );
      }

      if (kmDepotEnd < kmMissionEnd) {
        throw new Error(
          `Le kilométrage de retour au dépôt (${kmDepotEnd.toLocaleString()} km) ne peut pas être inférieur au kilométrage de fin de mission (${kmMissionEnd.toLocaleString()} km)`
        );
      }

      // Si le kilométrage de début de mission existe, vérifier la cohérence
      if (mission.kmMissionStart && kmMissionEnd < mission.kmMissionStart) {
        throw new Error(
          `Le kilométrage de fin de mission (${kmMissionEnd.toLocaleString()} km) ne peut pas être inférieur au kilométrage de début de mission (${mission.kmMissionStart.toLocaleString()} km)`
        );
      }

      // Calculs de toutes les distances
      const calculations = this.calculateAllDistances({
        kmDepotStart: mission.kmDepotStart,
        kmMissionStart: mission.kmMissionStart,
        kmMissionEnd,
        kmDepotEnd
      });

      // Mettre à jour la mission avec statut COMPLETED
      const updateData = {
        kmMissionEnd,
        kmDepotEnd,
        distanceDepotToDepot: calculations.distanceDepotToDepot,
        distanceMissionOnly: calculations.distanceMissionOnly,
        status: 'COMPLETED' as const,
        actualArrivalAt: new Date().toISOString()
      };

      await databaseService.updateMission(missionId, updateData);

      // Mettre à jour le kilométrage final du véhicule de la flotte
      if (mission.vehicleId) {
        await databaseService.updateVehicleMileage(mission.vehicleId, kmDepotEnd);
        console.log(`✅ Véhicule ${mission.vehicleId} kilométrage final: ${kmDepotEnd.toLocaleString()} km`);
      }

      console.log(`✅ Mission ${missionId} terminée:`);
      console.log(`   - Distance mission: ${calculations.distanceMissionOnly} km`);
      console.log(`   - Distance totale: ${calculations.distanceDepotToDepot} km`);

    } catch (error: any) {
      console.error('Erreur complétion mission:', error);
      throw new Error(`Impossible de terminer la mission: ${error.message}`);
    }
  }

  /**
   * Calcule toutes les distances à partir des kilométrages
   */
  static calculateAllDistances(data: KilometragePhaseData): KilometrageCalculations {
    const {
      kmDepotStart = 0,
      kmMissionStart = 0,
      kmMissionEnd = 0,
      kmDepotEnd = 0
    } = data;

    return {
      distanceDepotToMission: Math.max(0, kmMissionStart - kmDepotStart),
      distanceMissionOnly: Math.max(0, kmMissionEnd - (kmMissionStart || kmDepotStart)),
      distanceMissionToDepot: Math.max(0, kmDepotEnd - kmMissionEnd),
      distanceDepotToDepot: Math.max(0, kmDepotEnd - kmDepotStart)
    };
  }

  /**
   * Obtient l'état actuel du kilométrage pour une mission
   */
  static getKilometrageStatus(mission: Mission): 'not_started' | 'depot_only' | 'mission_started' | 'completed' {
    if (!mission.kmDepotStart) {
      return 'not_started';
    }
    
    if (!mission.kmMissionStart) {
      return 'depot_only';
    }
    
    if (!mission.kmMissionEnd || !mission.kmDepotEnd) {
      return 'mission_started';
    }
    
    return 'completed';
  }

  /**
   * Formate les informations de kilométrage pour affichage
   */
  static formatKilometrageInfo(mission: Mission): string {
    const status = this.getKilometrageStatus(mission);
    
    switch (status) {
      case 'not_started':
        return 'Kilométrage non commencé';
      case 'depot_only':
        return `Départ dépôt: ${mission.kmDepotStart?.toLocaleString()} km`;
      case 'mission_started':
        return `En cours - Dernier relevé: ${mission.kmMissionStart?.toLocaleString()} km`;
      case 'completed':
        return `Terminé - Total: ${mission.distanceDepotToDepot?.toLocaleString()} km`;
      default:
        return 'État inconnu';
    }
  }
}
