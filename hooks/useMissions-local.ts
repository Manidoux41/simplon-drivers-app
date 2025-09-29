import { useState, useEffect, useCallback } from 'react';
import { databaseService, Mission, Company } from '../lib/database';
import { authService } from '../lib/auth-local';
import { missionEventBus } from '../services/MissionEventBus';

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [companies, setCompanies] = useState<{ [key: string]: Company }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      let missionsData: Mission[];

      // Charger les missions selon le rôle
      if (currentUser.role === 'ADMIN') {
        missionsData = await databaseService.getAllMissions();
      } else {
        missionsData = await databaseService.getMissionsByDriverId(currentUser.id);
      }

      // Charger les compagnies
      const companiesData = await databaseService.getAllCompanies();
      const companiesMap: { [key: string]: Company } = {};
      companiesData.forEach(company => {
        companiesMap[company.id] = company;
      });

      setMissions(missionsData);
      setCompanies(companiesMap);
    } catch (err) {
      console.error('Erreur chargement missions:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setMissions([]);
      setCompanies({});
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMissionStatus = async (missionId: string, status: string) => {
    try {
      const actualTime = new Date().toISOString();
      await databaseService.updateMissionStatus(missionId, status, actualTime);
      
      // Recharger les missions après la mise à jour
      await loadMissions();
    } catch (err) {
      console.error('Erreur mise à jour mission:', err);
      throw err;
    }
  };

  const getMissionById = async (id: string): Promise<Mission | null> => {
    try {
      return await databaseService.getMissionById(id);
    } catch (err) {
      console.error('Erreur récupération mission:', err);
      return null;
    }
  };

  const getTodayMissions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return missions.filter(mission => {
      const missionDate = new Date(mission.scheduledDepartureAt);
      return missionDate >= today && missionDate < tomorrow;
    });
  };

  const getUpcomingMissions = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return missions.filter(mission => {
      const missionDate = new Date(mission.scheduledDepartureAt);
      return missionDate >= tomorrow;
    }).slice(0, 5); // Limiter à 5 missions
  };

  const getInProgressMissions = () => {
    return missions.filter(mission => mission.status === 'IN_PROGRESS');
  };

  const getCompletedMissions = () => {
    return missions.filter(mission => mission.status === 'COMPLETED');
  };

  const getPendingMissions = () => {
    return missions.filter(mission => mission.status === 'PENDING');
  };

  // Charger les missions au montage du composant
  useEffect(() => {
    loadMissions();
  }, []);

  // Écouter les changements de missions via l'event bus
  useEffect(() => {
    const handleMissionChange = () => {
      console.log('🔄 useMissions: Rechargement automatique des missions suite à un changement');
      loadMissions();
    };

    missionEventBus.subscribe(handleMissionChange);

    return () => {
      missionEventBus.unsubscribe(handleMissionChange);
    };
  }, [loadMissions]);

  // Fonctions de confirmation de mission
  const acceptMission = async (missionId: string) => {
    try {
      await databaseService.updateMission(missionId, { 
        status: 'ASSIGNED'
      });
      await loadMissions();
    } catch (err) {
      console.error('Erreur acceptation mission:', err);
      throw err;
    }
  };

  const refuseMission = async (missionId: string) => {
    try {
      await databaseService.updateMission(missionId, { 
        driverId: '',
        status: 'PENDING'
      });
      await loadMissions();
    } catch (err) {
      console.error('Erreur refus mission:', err);
      throw err;
    }
  };

  // Obtenir les missions en attente de confirmation pour l'utilisateur actuel
  const getPendingConfirmationMissions = () => {
    return missions.filter(mission => 
      mission.status === 'PENDING' && 
      mission.driverId // Mission assignée mais en attente de confirmation
    );
  };

  return {
    missions,
    companies,
    loading,
    error,
    loadMissions,
    updateMissionStatus,
    getMissionById,
    getTodayMissions,
    getUpcomingMissions,
    getInProgressMissions,
    getCompletedMissions,
    getPendingMissions,
    acceptMission,
    refuseMission,
    getPendingConfirmationMissions,
  };
}
