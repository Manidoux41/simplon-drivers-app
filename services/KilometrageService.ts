import { Mission } from '../lib/database';
import { databaseService } from '../lib/database';

export interface KilometrageData {
  kmDepotStart?: number;
  kmMissionStart?: number;
  kmMissionEnd?: number;
  kmDepotEnd?: number;
}

export interface KilometrageCalculations {
  distanceDepotToDepot: number;
  distanceMissionOnly: number;
  distanceDepotToMission: number;
  distanceMissionToDepot: number;
}

export class KilometrageService {
  /**
   * Calcule automatiquement les distances à partir des kilomètres saisis
   */
  static calculateDistances(kilometrage: KilometrageData): KilometrageCalculations {
    const {
      kmDepotStart = 0,
      kmMissionStart = 0,
      kmMissionEnd = 0,
      kmDepotEnd = 0
    } = kilometrage;

    // Distance totale dépôt à dépôt
    const distanceDepotToDepot = kmDepotEnd - kmDepotStart;
    
    // Distance mission uniquement (prise en charge -> destination)
    const distanceMissionOnly = kmMissionEnd - kmMissionStart;
    
    // Distance dépôt -> début mission
    const distanceDepotToMission = kmMissionStart - kmDepotStart;
    
    // Distance fin mission -> dépôt
    const distanceMissionToDepot = kmDepotEnd - kmMissionEnd;

    return {
      distanceDepotToDepot: Math.max(0, distanceDepotToDepot),
      distanceMissionOnly: Math.max(0, distanceMissionOnly),
      distanceDepotToMission: Math.max(0, distanceDepotToMission),
      distanceMissionToDepot: Math.max(0, distanceMissionToDepot)
    };
  }

  /**
   * Met à jour le kilométrage de départ (dépôt + début mission)
   */
  static async updateStartKilometrage(
    missionId: string, 
    kmDepotStart: number, 
    kmMissionStart: number
  ): Promise<void> {
    try {
      const mission = await databaseService.getMissionById(missionId);
      if (!mission) {
        throw new Error('Mission non trouvée');
      }

      // Validation des données
      if (kmMissionStart < kmDepotStart) {
        throw new Error('Le kilométrage de début de mission ne peut pas être inférieur au kilométrage de départ du dépôt');
      }

      // Calcul des distances partielles
      const updatedKilometrage = {
        ...mission,
        kmDepotStart,
        kmMissionStart,
        distanceDepotToDepot: mission.kmDepotEnd ? mission.kmDepotEnd - kmDepotStart : undefined,
        distanceMissionOnly: mission.kmMissionEnd ? mission.kmMissionEnd - kmMissionStart : undefined
      };

      await databaseService.updateMission(missionId, updatedKilometrage);
      
      console.log(`✅ Kilométrage de départ mis à jour pour mission ${missionId}`);
    } catch (error) {
      console.error('Erreur mise à jour kilométrage départ:', error);
      throw error;
    }
  }

  /**
   * Met à jour le kilométrage de fin (fin mission + retour dépôt)
   */
  static async updateEndKilometrage(
    missionId: string, 
    kmMissionEnd: number, 
    kmDepotEnd: number
  ): Promise<void> {
    try {
      const mission = await databaseService.getMissionById(missionId);
      if (!mission) {
        throw new Error('Mission non trouvée');
      }

      // Validation des données
      if (mission.kmMissionStart && kmMissionEnd < mission.kmMissionStart) {
        throw new Error('Le kilométrage de fin de mission ne peut pas être inférieur au kilométrage de début');
      }

      if (kmDepotEnd < kmMissionEnd) {
        throw new Error('Le kilométrage de retour dépôt ne peut pas être inférieur au kilométrage de fin de mission');
      }

      // Calcul complet des distances
      const calculations = this.calculateDistances({
        kmDepotStart: mission.kmDepotStart,
        kmMissionStart: mission.kmMissionStart,
        kmMissionEnd,
        kmDepotEnd
      });

      const updatedKilometrage = {
        ...mission,
        kmMissionEnd,
        kmDepotEnd,
        distanceDepotToDepot: calculations.distanceDepotToDepot,
        distanceMissionOnly: calculations.distanceMissionOnly,
        actualArrivalAt: new Date().toISOString() // Marquer l'heure de fin réelle
      };

      await databaseService.updateMission(missionId, updatedKilometrage);
      
      console.log(`✅ Kilométrage de fin mis à jour pour mission ${missionId}`);
      console.log(`📊 Distance totale: ${calculations.distanceDepotToDepot} km`);
      console.log(`📊 Distance mission: ${calculations.distanceMissionOnly} km`);
    } catch (error) {
      console.error('Erreur mise à jour kilométrage fin:', error);
      throw error;
    }
  }

  /**
   * Valide la cohérence des kilomètres saisis
   */
  static validateKilometrage(kilometrage: KilometrageData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const {
      kmDepotStart,
      kmMissionStart,
      kmMissionEnd,
      kmDepotEnd
    } = kilometrage;

    // Vérifications de cohérence
    if (kmDepotStart !== undefined && kmMissionStart !== undefined) {
      if (kmMissionStart < kmDepotStart) {
        errors.push('Le kilométrage de début de mission doit être supérieur au kilométrage de départ du dépôt');
      }
    }

    if (kmMissionStart !== undefined && kmMissionEnd !== undefined) {
      if (kmMissionEnd < kmMissionStart) {
        errors.push('Le kilométrage de fin de mission doit être supérieur au kilométrage de début');
      }
    }

    if (kmMissionEnd !== undefined && kmDepotEnd !== undefined) {
      if (kmDepotEnd < kmMissionEnd) {
        errors.push('Le kilométrage de retour dépôt doit être supérieur au kilométrage de fin de mission');
      }
    }

    // Vérifications de valeurs raisonnables
    const allKm = [kmDepotStart, kmMissionStart, kmMissionEnd, kmDepotEnd].filter(km => km !== undefined);
    if (allKm.length > 0) {
      const maxKm = Math.max(...allKm);
      const minKm = Math.min(...allKm);
      
      if (maxKm - minKm > 1000) {
        errors.push('La différence de kilométrage semble trop importante (> 1000 km)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formate l'affichage des kilomètres
   */
  static formatKilometrage(km?: number): string {
    if (km === undefined || km === null) {
      return '--';
    }
    return `${km.toLocaleString('fr-FR')} km`;
  }

  /**
   * Génère un résumé kilométrique pour affichage
   */
  static generateKilometrageSummary(mission: Mission): {
    hasKilometrageData: boolean;
    summary: string;
    details: {
      depotStart: string;
      missionStart: string;
      missionEnd: string;
      depotEnd: string;
      totalDistance: string;
      missionDistance: string;
    };
  } {
    const hasKilometrageData = !!(
      mission.kmDepotStart || 
      mission.kmMissionStart || 
      mission.kmMissionEnd || 
      mission.kmDepotEnd
    );

    if (!hasKilometrageData) {
      return {
        hasKilometrageData: false,
        summary: 'Aucun kilométrage renseigné',
        details: {
          depotStart: '--',
          missionStart: '--',
          missionEnd: '--',
          depotEnd: '--',
          totalDistance: '--',
          missionDistance: '--'
        }
      };
    }

    const calculations = this.calculateDistances({
      kmDepotStart: mission.kmDepotStart,
      kmMissionStart: mission.kmMissionStart,
      kmMissionEnd: mission.kmMissionEnd,
      kmDepotEnd: mission.kmDepotEnd
    });

    return {
      hasKilometrageData: true,
      summary: `${calculations.distanceDepotToDepot} km total (${calculations.distanceMissionOnly} km mission)`,
      details: {
        depotStart: this.formatKilometrage(mission.kmDepotStart),
        missionStart: this.formatKilometrage(mission.kmMissionStart),
        missionEnd: this.formatKilometrage(mission.kmMissionEnd),
        depotEnd: this.formatKilometrage(mission.kmDepotEnd),
        totalDistance: this.formatKilometrage(calculations.distanceDepotToDepot),
        missionDistance: this.formatKilometrage(calculations.distanceMissionOnly)
      }
    };
  }

  /**
   * Estime les coûts basés sur le kilométrage
   */
  static estimateCosts(
    distanceKm: number, 
    fuelCostPerKm: number = 0.15, 
    maintenanceCostPerKm: number = 0.05
  ): {
    fuelCost: number;
    maintenanceCost: number;
    totalCost: number;
  } {
    const fuelCost = distanceKm * fuelCostPerKm;
    const maintenanceCost = distanceKm * maintenanceCostPerKm;
    const totalCost = fuelCost + maintenanceCost;

    return {
      fuelCost: Math.round(fuelCost * 100) / 100,
      maintenanceCost: Math.round(maintenanceCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100
    };
  }
}
