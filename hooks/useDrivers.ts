import { useState, useEffect } from 'react';
import { databaseService, User } from '../lib/database';

export function useDrivers() {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des chauffeurs...');
      
      const allUsers = await databaseService.getAllUsers();
      console.log('📊 Utilisateurs totaux trouvés:', allUsers.length);
      
      // Debug: afficher tous les utilisateurs
      allUsers.forEach(user => {
        console.log(`👤 Utilisateur: ${user.firstName} ${user.lastName} - Role: ${user.role} - Active: ${user.isActive}`);
      });
      
      // Filtrer uniquement les chauffeurs actifs
      const activeDrivers = allUsers.filter(user => 
        user.role === 'DRIVER' && user.isActive
      );
      
      console.log('🚗 Chauffeurs actifs:', activeDrivers.length);
      console.log('📋 Liste des chauffeurs:', activeDrivers.map(d => 
        `${d.firstName} ${d.lastName} (${d.email}) - Active: ${d.isActive}`
      ));
      
      setDrivers(activeDrivers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des chauffeurs';
      console.error('❌ Erreur chargement chauffeurs:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const refreshDrivers = () => {
    loadDrivers();
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  return {
    drivers,
    loading,
    error,
    refreshDrivers,
    loadDrivers
  };
}

// Instance globale pour partager l'état entre les composants
class DriversState {
  private listeners: (() => void)[] = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify() {
    this.listeners.forEach(callback => callback());
  }
}

export const driversState = new DriversState();

// Hook avec notification globale
export function useDriversWithNotification() {
  const driversHook = useDrivers();

  useEffect(() => {
    const unsubscribe = driversState.subscribe(() => {
      console.log('🔔 Notification reçue - Rechargement des chauffeurs');
      driversHook.refreshDrivers();
    });

    return unsubscribe;
  }, []);

  return driversHook;
}
