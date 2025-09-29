/**
 * Service de routage simple utilisant uniquement des services gratuits
 * Alternative sans clés API pour tester le système
 */

import { OptimizedRoute, HeavyVehicleRouteOptions, RouteInstruction, RouteRestriction } from './HeavyVehicleRouteService';

export class FreeRoutingService {
  
  /**
   * Calcule un itinéraire avec des services gratuits uniquement
   */
  static async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    vehicleOptions: HeavyVehicleRouteOptions
  ): Promise<OptimizedRoute> {
    
    console.log('🆓 Utilisation du service de routage gratuit');
    
    try {
      // Essayer avec OpenStreetMap Routing Service (gratuit)
      return await this.calculateWithOSRM(origin, destination, vehicleOptions);
    } catch (osrmError) {
      console.warn('OSRM failed:', osrmError);
      
      // Fallback : calcul basique avec distance vol d'oiseau
      return this.calculateBasicRoute(origin, destination, vehicleOptions);
    }
  }
  
  /**
   * Calcul avec OpenStreetMap via service public
   */
  private static async calculateWithOSRM(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    vehicleOptions: HeavyVehicleRouteOptions
  ): Promise<OptimizedRoute> {
    
    // Utiliser un service OSRM public avec HTTPS
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;
    
    console.log('🌍 Appel OSRM:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SimplonDriversApp/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM: ${data.message || 'Erreur de routage'}`);
    }
    
    const route = data.routes[0];
    const leg = route.legs[0];
    
    console.log('✅ Route OSRM calculée:', {
      distance: `${(route.distance / 1000).toFixed(1)} km`,
      duration: `${Math.round(route.duration / 60)} min`,
      steps: leg.steps?.length || 0
    });
    
    // Générer des avertissements pour poids lourds
    const warnings = this.generateHeavyVehicleWarnings(vehicleOptions);
    const restrictions = this.generateHeavyVehicleRestrictions(vehicleOptions);
    
    return {
      distance: route.distance,
      duration: route.duration,
      polyline: this.convertGeojsonToPolyline(route.geometry),
      instructions: this.convertOSRMSteps(leg.steps || []),
      restrictions,
      warnings
    };
  }
  
  /**
   * Calcul basique si tous les services échouent
   */
  private static calculateBasicRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    vehicleOptions: HeavyVehicleRouteOptions
  ): OptimizedRoute {
    
    console.log('📐 Calcul basique de l\'itinéraire');
    
    // Distance haversine
    const distance = this.calculateDistance(origin, destination);
    
    // Estimation temps (moyenne 50 km/h en tenant compte des arrêts)
    const duration = (distance / 1000) * 72; // 72 minutes par 100km
    
    const warnings = [
      '⚠️ Itinéraire calculé en mode basique',
      '📍 Distance et durée estimées (vol d\'oiseau majoré)',
      '🚛 Restrictions poids lourds simulées - À vérifier manuellement',
      '🗺️ Utilisez un GPS spécialisé poids lourds pour la navigation',
      ...this.generateHeavyVehicleWarnings(vehicleOptions)
    ];
    
    const restrictions = this.generateHeavyVehicleRestrictions(vehicleOptions);
    
    return {
      distance: distance * 1.3, // Majorer de 30% pour tenir compte des routes
      duration: duration * 60, // convertir en secondes  
      polyline: `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`,
      instructions: [
        {
          text: `Se diriger vers la destination (estimation: ${(distance * 1.3 / 1000).toFixed(1)} km)`,
          distance: distance * 1.3,
          duration: duration * 60,
          coordinate: [destination.longitude, destination.latitude]
        }
      ],
      restrictions,
      warnings
    };
  }
  
  /**
   * Convertit une géométrie GeoJSON en polyline simple
   */
  private static convertGeojsonToPolyline(geometry: any): string {
    if (!geometry?.coordinates) return '';
    
    return geometry.coordinates
      .filter((_: any, index: number) => index % 5 === 0) // Simplifier en gardant 1 point sur 5
      .map((coord: number[]) => `${coord[1]},${coord[0]}`)
      .join('|');
  }
  
  /**
   * Convertit les étapes OSRM en instructions
   */
  private static convertOSRMSteps(steps: any[]): RouteInstruction[] {
    return steps.map((step, index) => ({
      text: step.maneuver?.instruction || `Étape ${index + 1}`,
      distance: step.distance || 0,
      duration: step.duration || 0,
      coordinate: step.maneuver?.location || [0, 0]
    }));
  }
  
  /**
   * Génère les avertissements pour poids lourds
   */
  private static generateHeavyVehicleWarnings(options: HeavyVehicleRouteOptions): string[] {
    const warnings: string[] = [];
    
    if (options.weight > 40) {
      warnings.push(`🔴 ATTENTION: Véhicule ${options.weight}t - Poids exceptionnel`);
    } else if (options.weight > 19) {
      warnings.push(`🟡 INFO: Véhicule ${options.weight}t - Restrictions poids lourds`);
    }
    
    if (options.height && options.height > 4.0) {
      warnings.push(`🔴 HAUTEUR: ${options.height}m - Vérifier tous les passages`);
    }
    
    if (options.width && options.width > 2.55) {
      warnings.push(`🔴 LARGEUR: ${options.width}m - Convoi exceptionnel`);
    }
    
    if (options.hazmat) {
      warnings.push(`⚠️ HAZMAT: Restrictions tunnels et agglomérations`);
    }
    
    return warnings;
  }
  
  /**
   * Génère les restrictions simulées
   */
  private static generateHeavyVehicleRestrictions(options: HeavyVehicleRouteOptions): RouteRestriction[] {
    const restrictions: RouteRestriction[] = [];
    
    if (options.weight > 44) {
      restrictions.push({
        type: 'weight',
        description: `Poids ${options.weight}t supérieur à la limite légale (44t)`,
        coordinate: [0, 0],
        severity: 'error'
      });
    }
    
    if (options.height && options.height > 4.0) {
      restrictions.push({
        type: 'height',
        description: `Hauteur ${options.height}m - Attention aux ponts bas`,
        coordinate: [0, 0],
        severity: 'warning'
      });
    }
    
    return restrictions;
  }
  
  /**
   * Calcule la distance haversine entre deux points
   */
  private static calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Rayon de la Terre en mètres
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}