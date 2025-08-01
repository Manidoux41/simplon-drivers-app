/**
 * Service de calcul d'itinéraires avec API de routing
 * Utilise l'API OpenRoute Service (gratuite) pour calculer les itinéraires
 */

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  distance: number;
  duration: number;
  instruction: string;
  coordinates: RoutePoint[];
}

export interface RouteResult {
  distance: number; // en kilomètres
  duration: number; // en minutes
  polyline: RoutePoint[];
  segments: RouteSegment[];
  summary: {
    totalDistance: string;
    totalDuration: string;
    estimatedFuelCost?: number;
  };
}

export class RouteCalculationService {
  // API gratuite OpenRoute Service (alternative à Google)
  private static readonly API_KEY = '5b3ce3597851110001cf6248a3a5ac5be67940d997b80fb1ac2e2f2c';
  private static readonly BASE_URL = 'https://api.openrouteservice.org/v2';
  
  private static routeCache = new Map<string, RouteResult>();
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 1000; // 1 seconde entre requêtes

  /**
   * Contrôle du taux de requêtes
   */
  private static async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const delay = this.REQUEST_DELAY - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Calcule un itinéraire entre deux points
   */
  static async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
  ): Promise<RouteResult | null> {
    const cacheKey = `${start.latitude},${start.longitude}-${end.latitude},${end.longitude}-${profile}`;
    
    // Vérifier le cache
    if (this.routeCache.has(cacheKey)) {
      console.log('📍 Route en cache:', cacheKey);
      return this.routeCache.get(cacheKey)!;
    }

    try {
      await this.waitForRateLimit();
      
      console.log('🗺️ Calcul d\'itinéraire:', start, '→', end);
      
      const requestBody = {
        coordinates: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude]
        ],
        format: 'json',
        profile,
        geometry_format: 'polyline',
        instructions: true,
        elevation: false
      };

      const response = await fetch(`${this.BASE_URL}/directions/${profile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.warn('⚠️ Erreur API routing:', response.status);
        return this.calculateFallbackRoute(start, end);
      }

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const summary = route.summary;
        
        // Décoder la polyline
        const polyline = this.decodePolyline(route.geometry);
        
        // Convertir les segments
        const segments: RouteSegment[] = route.segments?.map((segment: any) => ({
          distance: segment.distance / 1000, // mètres → km
          duration: segment.duration / 60, // secondes → minutes
          instruction: segment.steps?.[0]?.instruction || 'Continuer',
          coordinates: polyline.slice(
            Math.floor(segment.steps?.[0]?.way_points?.[0] || 0),
            Math.floor(segment.steps?.[0]?.way_points?.[1] || polyline.length)
          )
        })) || [];

        const result: RouteResult = {
          distance: summary.distance / 1000, // mètres → kilomètres
          duration: summary.duration / 60, // secondes → minutes
          polyline,
          segments,
          summary: {
            totalDistance: `${(summary.distance / 1000).toFixed(1)} km`,
            totalDuration: this.formatDuration(summary.duration / 60),
            estimatedFuelCost: this.calculateFuelCost(summary.distance / 1000),
          },
        };

        // Mettre en cache
        this.routeCache.set(cacheKey, result);
        
        console.log(`✅ Itinéraire calculé: ${result.summary.totalDistance}, ${result.summary.totalDuration}`);
        return result;
      }

      console.warn('⚠️ Aucun itinéraire trouvé');
      return this.calculateFallbackRoute(start, end);
      
    } catch (error) {
      console.error('❌ Erreur calcul itinéraire:', error);
      return this.calculateFallbackRoute(start, end);
    }
  }

  /**
   * Calcul d'itinéraire de fallback (ligne droite avec estimation)
   */
  private static calculateFallbackRoute(start: RoutePoint, end: RoutePoint): RouteResult {
    const distance = this.calculateHaversineDistance(start, end);
    const estimatedDuration = (distance / 45) * 60; // 45 km/h moyenne
    
    return {
      distance,
      duration: estimatedDuration,
      polyline: [start, end],
      segments: [{
        distance,
        duration: estimatedDuration,
        instruction: 'Itinéraire direct estimé',
        coordinates: [start, end]
      }],
      summary: {
        totalDistance: `${distance.toFixed(1)} km`,
        totalDuration: this.formatDuration(estimatedDuration),
        estimatedFuelCost: this.calculateFuelCost(distance),
      },
    };
  }

  /**
   * Calcule la distance à vol d'oiseau entre deux points (méthode publique)
   */
  static calculateStraightLineDistance(start: RoutePoint, end: RoutePoint): number {
    return this.calculateHaversineDistance(start, end);
  }

  /**
   * Calcule la distance à vol d'oiseau entre deux points (Haversine)
   */
  private static calculateHaversineDistance(start: RoutePoint, end: RoutePoint): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(end.latitude - start.latitude);
    const dLon = this.deg2rad(end.longitude - start.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(start.latitude)) * Math.cos(this.deg2rad(end.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Décode une polyline encodée en tableau de coordonnées
   */
  private static decodePolyline(encoded: string): RoutePoint[] {
    const poly: RoutePoint[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5
      });
    }

    return poly;
  }

  /**
   * Formate une durée en minutes en texte lisible
   */
  private static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  }

  /**
   * Calcule le coût estimé en carburant
   */
  private static calculateFuelCost(distanceKm: number): number {
    const consumptionL100km = 8; // 8L/100km pour un bus
    const fuelPricePerLiter = 1.5; // 1.50€/L
    
    return (distanceKm * consumptionL100km / 100) * fuelPricePerLiter;
  }

  /**
   * Vide le cache
   */
  static clearCache(): void {
    this.routeCache.clear();
    console.log('🗑️ Cache itinéraires vidé');
  }

  /**
   * Statistiques du cache
   */
  static getCacheStats(): { size: number; routes: string[] } {
    return {
      size: this.routeCache.size,
      routes: Array.from(this.routeCache.keys()),
    };
  }
}
