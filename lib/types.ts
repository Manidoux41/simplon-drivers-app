export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber?: string;
  role: 'DRIVER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  contactPerson: string;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  
  // Departure information
  departureLocation: string;
  departureAddress: string;
  departureLat: number;
  departureLng: number;
  scheduledDepartureAt: Date;
  actualDepartureAt?: Date;
  
  // Arrival information
  arrivalLocation: string;
  arrivalAddress: string;
  arrivalLat: number;
  arrivalLng: number;
  estimatedArrivalAt: Date;
  actualArrivalAt?: Date;
  
  // Route information
  routePolyline?: string;
  distance?: number;
  estimatedDuration?: number;
  
  // Passengers information
  maxPassengers: number;
  currentPassengers: number;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  driverId: string;
  driver: User;
  companyId: string;
  company: Company;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DRIVER' | 'ADMIN';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}
