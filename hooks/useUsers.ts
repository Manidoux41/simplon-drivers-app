import { useState, useEffect } from 'react';
import { databaseService, User } from '../lib/database';
import { driversState } from './useDrivers';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const allUsers = await databaseService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phoneNumber?: string;
    role: 'DRIVER' | 'ADMIN';
    password: string;
  }) => {
    try {
      await databaseService.createUser(userData);
      await loadUsers(); // Recharger la liste
      
      // Si c'est un chauffeur, notifier les autres composants
      if (userData.role === 'DRIVER') {
        console.log('🔔 Nouveau chauffeur créé, notification des autres composants');
        driversState.notify();
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur');
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: 'DRIVER' | 'ADMIN') => {
    try {
      await databaseService.updateUserRole(userId, newRole);
      await loadUsers(); // Recharger la liste
      
      // Notifier les autres composants car cela peut affecter la liste des chauffeurs
      console.log('🔔 Rôle utilisateur modifié, notification des autres composants');
      driversState.notify();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du rôle');
      return false;
    }
  };

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await databaseService.updateUserStatus(userId, isActive);
      await loadUsers(); // Recharger la liste
      
      // Notifier les autres composants car cela peut affecter la liste des chauffeurs actifs
      console.log('🔔 Statut utilisateur modifié, notification des autres composants');
      driversState.notify();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  const updateUser = async (userId: string, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    licenseNumber?: string;
    phoneNumber?: string;
  }) => {
    try {
      await databaseService.updateUser(userId, userData);
      await loadUsers(); // Recharger la liste
      
      // Notifier les autres composants
      console.log('🔔 Utilisateur modifié, notification des autres composants');
      driversState.notify();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification de l\'utilisateur');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await databaseService.deleteUser(userId);
      await loadUsers(); // Recharger la liste
      
      // Notifier les autres composants
      console.log('🔔 Utilisateur supprimé, notification des autres composants');
      driversState.notify();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'utilisateur');
      return false;
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    error,
    loadUsers,
    createUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
  };
}
