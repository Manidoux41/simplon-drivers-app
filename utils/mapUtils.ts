import { Coordinates, RoutePoint } from '../lib/types';

export class MapUtils {
  /**
   * Calcule la distance entre deux points géographiques en kilomètres
   * Utilise la formule de Haversine
   */
  static calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * Convertit des degrés en radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcule le centre géographique d'un ensemble de points
   */
  static calculateCenter(points: Coordinates[]): Coordinates {
    if (points.length === 0) {
      throw new Error('Au moins un point est requis');
    }

    if (points.length === 1) {
      return points[0];
    }

    let totalLat = 0;
    let totalLng = 0;

    points.forEach(point => {
      totalLat += point.latitude;
      totalLng += point.longitude;
    });

    return {
      latitude: totalLat / points.length,
      longitude: totalLng / points.length,
    };
  }

  /**
   * Calcule une région qui englobe tous les points donnés
   */
  static calculateRegion(points: Coordinates[], padding: number = 0.1) {
    if (points.length === 0) {
      throw new Error('Au moins un point est requis');
    }

    const latitudes = points.map(p => p.latitude);
    const longitudes = points.map(p => p.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = (maxLat - minLat) + padding;
    const lngDelta = (maxLng - minLng) + padding;

    return {
      latitude: (maxLat + minLat) / 2,
      longitude: (maxLng + minLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }

  /**
   * Formate les coordonnées pour l'affichage
   */
  static formatCoordinates(coordinates: Coordinates, precision: number = 4): string {
    const lat = coordinates.latitude.toFixed(precision);
    const lng = coordinates.longitude.toFixed(precision);
    return `${lat}, ${lng}`;
  }

  /**
   * Vérifie si des coordonnées sont valides
   */
  static isValidCoordinates(coordinates: Coordinates): boolean {
    const { latitude, longitude } = coordinates;
    
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Génère une URL Google Maps pour la navigation
   */
  static getGoogleMapsUrl(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[]
  ): string {
    const baseUrl = 'https://www.google.com/maps/dir/';
    
    let url = `${baseUrl}${origin.latitude},${origin.longitude}/`;
    
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach(waypoint => {
        url += `${waypoint.latitude},${waypoint.longitude}/`;
      });
    }
    
    url += `${destination.latitude},${destination.longitude}`;
    
    return url;
  }

  /**
   * Génère une URL Apple Maps pour la navigation
   */
  static getAppleMapsUrl(
    origin: Coordinates,
    destination: Coordinates
  ): string {
    return `http://maps.apple.com/?saddr=${origin.latitude},${origin.longitude}&daddr=${destination.latitude},${destination.longitude}&dirflg=d`;
  }

  /**
   * Estime le temps de trajet en fonction de la distance (approximation)
   */
  static estimateTravelTime(distanceInKm: number, averageSpeedKph: number = 60): number {
    // Retourne le temps en minutes
    return Math.round((distanceInKm / averageSpeedKph) * 60);
  }

  /**
   * Convertit une polyline encodée en tableau de coordonnées
   */
  static decodePolyline(encoded: string): Coordinates[] {
    const coordinates: Coordinates[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lat += ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lng += ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  }

  /**
   * Crée des points de route avec titres et descriptions
   */
  static createRoutePoints(
    departure: { coordinates: Coordinates; title: string; description?: string },
    arrival: { coordinates: Coordinates; title: string; description?: string },
    waypoints?: { coordinates: Coordinates; title: string; description?: string }[]
  ): RoutePoint[] {
    const points: RoutePoint[] = [];

    // Point de départ
    points.push({
      latitude: departure.coordinates.latitude,
      longitude: departure.coordinates.longitude,
      title: departure.title,
      description: departure.description || 'Point de départ',
    });

    // Points intermédiaires
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach(waypoint => {
        points.push({
          latitude: waypoint.coordinates.latitude,
          longitude: waypoint.coordinates.longitude,
          title: waypoint.title,
          description: waypoint.description || 'Point intermédiaire',
        });
      });
    }

    // Point d'arrivée
    points.push({
      latitude: arrival.coordinates.latitude,
      longitude: arrival.coordinates.longitude,
      title: arrival.title,
      description: arrival.description || 'Point d\'arrivée',
    });

    return points;
  }
}
