export interface Mission {
  id: string;
  title: string;
  description?: string;
  clientName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  scheduledDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  
  // Champs kilométrage
  kmDepotStart?: number;
  kmMissionStart?: number;
  kmMissionEnd?: number;
  kmDepotEnd?: number;
  distanceDepotToDepot?: number;
  distanceMissionOnly?: number;
}

export interface CreateMissionData {
  title: string;
  description?: string;
  clientName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  scheduledDate: string;
  status?: Mission['status'];
  
  // Champs kilométrage optionnels
  kmDepotStart?: number;
  kmMissionStart?: number;
  kmMissionEnd?: number;
  kmDepotEnd?: number;
}

export interface UpdateMissionData {
  title?: string;
  description?: string;
  clientName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  scheduledDate?: string;
  status?: Mission['status'];
  
  // Champs kilométrage
  kmDepotStart?: number;
  kmMissionStart?: number;
  kmMissionEnd?: number;
  kmDepotEnd?: number;
  distanceDepotToDepot?: number;
  distanceMissionOnly?: number;
}
