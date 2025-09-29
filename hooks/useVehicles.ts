import { useState, useEffect } from 'react';
import { databaseService, Vehicle } from '../lib/database';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVehicles, setActiveVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allVehicles, activesOnly] = await Promise.all([
        databaseService.getAllVehicles(),
        databaseService.getActiveVehicles()
      ]);
      setVehicles(allVehicles);
      setActiveVehicles(activesOnly);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (vehicleData: {
    brand: string;
    model: string;
    licensePlate: string;
    fleetNumber: string;
    mileage?: number;
    registrationDocument: {
      vin: string;
      firstRegistration: string;
      enginePower: number;
      fuelType: 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE';
      seats: number;
      category: string;
    };
  }) => {
    try {
      await databaseService.createVehicle(vehicleData);
      await loadVehicles(); // Recharger la liste
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du véhicule');
      return false;
    }
  };

  const updateVehicleMileage = async (vehicleId: string, newMileage: number) => {
    try {
      await databaseService.updateVehicleMileage(vehicleId, newMileage);
      await loadVehicles(); // Recharger la liste
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du kilométrage');
      return false;
    }
  };

  const updateVehicleStatus = async (vehicleId: string, isActive: boolean) => {
    try {
      await databaseService.updateVehicleStatus(vehicleId, isActive);
      await loadVehicles(); // Recharger la liste
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut');
      return false;
    }
  };

  const updateVehicle = async (vehicleId: string, vehicleData: {
    brand?: string;
    model?: string;
    licensePlate?: string;
    fleetNumber?: string;
    mileage?: number;
    registrationDocument?: {
      vin?: string;
      firstRegistration?: string;
      enginePower?: number;
      fuelType?: 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE';
      seats?: number;
      category?: string;
    };
  }) => {
    try {
      await databaseService.updateVehicle(vehicleId, vehicleData);
      await loadVehicles(); // Recharger la liste
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du véhicule');
      return false;
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
      await databaseService.deleteVehicle(vehicleId);
      await loadVehicles(); // Recharger la liste
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du véhicule');
      return false;
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  return {
    vehicles,
    activeVehicles,
    loading,
    error,
    loadVehicles,
    createVehicle,
    updateVehicleMileage,
    updateVehicleStatus,
    updateVehicle,
    deleteVehicle,
  };
}
