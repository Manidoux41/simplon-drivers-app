/**
 * Service d'optimisation d'itinéraire pour véhicules de plus de 19 tonnes
 * Utilise des API de routage spécialisées pour les poids lourds
 */

export interface HeavyVehicleRouteOptions {
  weight: number; // Poids en tonnes
  height?: number; // Hauteur en mètres
  width?: number; // Largeur en mètres
  length?: number; // Longueur en mètres
  axleLoad?: number; // Charge par essieu en tonnes
  hazmat?: boolean; // Transport de matières dangereuses
  avoidTolls?: boolean; // Éviter les péages
  avoidFerries?: boolean; // Éviter les ferries
}

export interface OptimizedRoute {
  distance: number; // Distance en mètres
  duration: number; // Durée en secondes
  polyline: string; // Polyline encodée de l'itinéraire
  instructions: RouteInstruction[];
  restrictions: RouteRestriction[];
  tollInfo?: TollInfo;
  warnings: string[];
}

export interface RouteInstruction {
  text: string;
  distance: number;
  duration: number;
  coordinate: [number, number]; // [lng, lat]
}

export interface RouteRestriction {
  type: 'weight' | 'height' | 'width' | 'length' | 'axle_load' | 'hazmat' | 'tunnel' | 'bridge';
  description: string;
  coordinate: [number, number];
  severity: 'warning' | 'error';
}

export interface TollInfo {
  totalCost: number;
  currency: string;
  sections: TollSection[];
}

export interface TollSection {
  name: string;
  cost: number;
  distance: number;
}

class HeavyVehicleRouteService {
  private readonly OPENROUTE_API_KEY = process.env.EXPO_PUBLIC_OPENROUTE_API_KEY;
  private readonly HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;
  
  /**
   * Calcule un itinéraire optimisé pour un véhicule de plus de 19 tonnes
   */
  async calculateHeavyVehicleRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    vehicleOptions: HeavyVehicleRouteOptions
  ): Promise<OptimizedRoute> {
    // Priorité des services selon les capacités (SANS Google Maps)
    const errors: string[] = [];
    
    // 1. Essayer HERE Maps (meilleur pour les poids lourds)
    if (this.HERE_API_KEY) {
      try {
        return await this.calculateRouteWithHere(origin, destination, vehicleOptions);
      } catch (error) {
        console.warn('HERE Maps failed:', error);
        errors.push(`HERE Maps: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    } else {
      errors.push('HERE Maps: Clé API non configurée');
    }
    
    // 2. Essayer OpenRouteService
    if (this.OPENROUTE_API_KEY) {
      try {
        return await this.calculateRouteWithOpenRoute(origin, destination, vehicleOptions);
      } catch (error) {
        console.warn('OpenRouteService failed:', error);
        errors.push(`OpenRouteService: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    } else {
      errors.push('OpenRouteService: Clé API non configurée');
    }
    
    // 3. Utiliser le service de routage gratuit comme fallback
    console.warn('Utilisation du service de routage gratuit (OpenStreetMap)');
    
    try {
      // Importer le service gratuit
      const { FreeRoutingService } = await import('./FreeRoutingService');
      return await FreeRoutingService.calculateRoute(origin, destination, vehicleOptions);
    } catch (freeServiceError) {
      console.error('Free routing service failed:', freeServiceError);
      errors.push(`Service gratuit: ${freeServiceError instanceof Error ? freeServiceError.message : 'Erreur inconnue'}`);
      
      // Dernier fallback : calcul basique
      return await this.calculateBasicHeavyVehicleRoute(origin, destination, vehicleOptions, errors);
    }
  }
  
  /**
   * Calcul avec HERE Maps (recommandé pour les poids lourds)
   */
  private async calculateRouteWithHere(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: HeavyVehicleRouteOptions
  ): Promise<OptimizedRoute> {
    const baseUrl = 'https://router.hereapi.com/v8/routes';
    
    const params = new URLSearchParams({
      apikey: this.HERE_API_KEY!,
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${destination.latitude},${destination.longitude}`,
      transportMode: 'truck',
      return: 'polyline,instructions,summary,tolls,incidents',
      // Paramètres spécifiques aux poids lourds
      'truck[grossWeight]': options.weight.toString(),
      'truck[weightPerAxle]': (options.axleLoad || options.weight / 2).toString(),
      'truck[height]': (options.height || 4.0).toString(),
      'truck[width]': (options.width || 2.55).toString(),
      'truck[length]': (options.length || 16.5).toString(),
      'truck[tunnelCategory]': options.hazmat ? 'E' : 'B',
      'avoid[features]': this.buildAvoidFeatures(options),
      lang: 'fr-FR'
    });
    
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HERE API Error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    return this.parseHereResponse(data, options);
  }
  
  /**
   * Calcul avec OpenRouteService
   */
  private async calculateRouteWithOpenRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: HeavyVehicleRouteOptions
  ): Promise<OptimizedRoute> {
    const baseUrl = 'https://api.openrouteservice.org/v2/directions/driving-hgv';
    
    const requestBody = {
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude]
      ],
      format: 'geojson',
      options: {
        vehicle_type: 'hgv',
        profile_params: {
          restrictions: {
            weight: options.weight,
            height: options.height || 4.0,
            width: options.width || 2.55,
            length: options.length || 16.5,
            axleload: options.axleLoad || options.weight / 2,
            hazmat: options.hazmat || false
          }
        },
        avoid_features: this.buildOpenRouteAvoidFeatures(options)
      },
      instructions: true,
      geometry: true,
      elevation: false
    };
    
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.OPENROUTE_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouteService Error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    return this.parseOpenRouteResponse(data, options);
  }
  
  /**
   * Fallback avec OpenStreetMap (gratuit)
   */
  private async calculateBasicHeavyVehicleRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: HeavyVehicleRouteOptions,
    apiErrors: string[]
  ): Promise<OptimizedRoute> {
    // Utiliser OSRM (OpenStreetMap Routing Machine) - gratuit
    try {
      return await this.calculateRouteWithOSRM(origin, destination, options, apiErrors);
    } catch (osrmError) {
      console.warn('OSRM failed, trying Mapbox:', osrmError);
      // Fallback vers une simulation basique si tout échoue
      return this.generateSimulatedRoute(origin, destination, options, [
        ...apiErrors,
        `OSRM: ${osrmError instanceof Error ? osrmError.message : 'Erreur inconnue'}`
      ]);
    }
  }

  /**
   * Calcul avec OSRM (OpenStreetMap Routing Machine) - Gratuit
   */
  private async calculateRouteWithOSRM(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: HeavyVehicleRouteOptions,
    apiErrors: string[]
  ): Promise<OptimizedRoute> {
    // Utiliser le serveur OSRM de demo avec HTTPS
    const baseUrl = 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
    const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    
    const params = new URLSearchParams({
      overview: 'full',
      geometries: 'geojson',
      steps: 'true',
      annotations: 'true'
    });
    
    const response = await fetch(`${baseUrl}/${coordinates}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`OSRM Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok') {
      throw new Error(`OSRM Error: ${data.message || 'Routage impossible'}`);
    }
    
    const route = data.routes[0];
    
    // Simuler des restrictions pour poids lourds
    const restrictions = this.generateHeavyVehicleRestrictions(route, options);
    const warnings = [
      'Itinéraire calculé avec OpenStreetMap (gratuit)',
      'Les restrictions spécifiques aux poids lourds sont simulées',
      'Vérifiez manuellement les limitations de hauteur et de poids sur votre trajet',
      ...apiErrors.map(error => `Service spécialisé indisponible: ${error}`)
    ];
    
    if (options.weight > 40) {
      warnings.push('⚠️ ATTENTION: Poids exceptionnel (>40t) - Autorisation spéciale requise');
    }
    
    if (options.height && options.height > 4.0) {
      warnings.push('⚠️ ATTENTION: Hauteur exceptionnelle (>4m) - Vérifiez les ponts');
    }
    
    if (options.weight > 19) {
      warnings.push('⚠️ RECOMMANDATION: Vérifiez les restrictions locales pour poids lourds');
    }
    
    return {
      distance: route.distance,
      duration: route.duration,
      polyline: this.encodePolylineFromGeojson(route.geometry),
      instructions: this.convertOSRMInstructions(route.legs[0]?.steps || []),
      restrictions,
      warnings
    };
  }

  /**
   * Génère un itinéraire simulé si tous les services échouent
   */
  private async generateSimulatedRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    options: HeavyVehicleRouteOptions,
    apiErrors: string[]
  ): Promise<OptimizedRoute> {
    // Calcul approximatif de la distance (formule haversine)
    const distance = this.calculateHaversineDistance(origin, destination);
    
    // Estimation basique de la durée (vitesse moyenne 60 km/h sur route)
    const duration = (distance / 1000) * 60; // minutes
    
    const warnings = [
      '⚠️ ATTENTION: Itinéraire simulé - Services de routage indisponibles',
      'Distance et durée estimées uniquement',
      'Vérifiez impérativement votre itinéraire avant le départ',
      'Les restrictions poids lourds ne sont PAS vérifiées',
      ...apiErrors.map(error => `${error}`)
    ];
    
    if (options.weight > 40) {
      warnings.push('🔴 CRITIQUE: Poids exceptionnel (>40t) - Autorisation spéciale OBLIGATOIRE');
    }
    
    if (options.height && options.height > 4.0) {
      warnings.push('🔴 CRITIQUE: Hauteur exceptionnelle (>4m) - Vérifiez TOUS les ponts');
    }
    
    const restrictions = this.generateSimulatedRestrictions(options);
    
    return {
      distance: distance,
      duration: duration * 60, // convertir en secondes
      polyline: `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`,
      instructions: [
        {
          text: `Direction générale vers la destination (${distance.toFixed(1)} km)`,
          distance: distance,
          duration: duration * 60,
          coordinate: [destination.longitude, destination.latitude]
        }
      ],
      restrictions,
      warnings
    };
  }
  
  private buildAvoidFeatures(options: HeavyVehicleRouteOptions): string {
    const features: string[] = [];
    if (options.avoidTolls) features.push('tollRoad');
    if (options.avoidFerries) features.push('ferry');
    return features.join(',');
  }
  
  private buildOpenRouteAvoidFeatures(options: HeavyVehicleRouteOptions): string[] {
    const features: string[] = [];
    if (options.avoidTolls) features.push('tollways');
    if (options.avoidFerries) features.push('ferries');
    return features;
  }
  
  private parseHereResponse(data: any, options: HeavyVehicleRouteOptions): OptimizedRoute {
    const route = data.routes[0];
    const section = route.sections[0];
    
    return {
      distance: section.summary.length,
      duration: section.summary.duration,
      polyline: section.polyline,
      instructions: section.actions?.map((action: any) => ({
        text: action.instruction,
        distance: action.length || 0,
        duration: action.duration || 0,
        coordinate: [action.location[1], action.location[0]]
      })) || [],
      restrictions: this.parseHereRestrictions(route.notices || []),
      tollInfo: route.tolls ? this.parseHereTolls(route.tolls) : undefined,
      warnings: route.notices?.filter((n: any) => n.severity === 'info').map((n: any) => n.title) || []
    };
  }
  
  private parseOpenRouteResponse(data: any, options: HeavyVehicleRouteOptions): OptimizedRoute {
    const feature = data.features[0];
    const properties = feature.properties;
    
    return {
      distance: properties.summary.distance,
      duration: properties.summary.duration,
      polyline: this.encodePolyline(feature.geometry.coordinates),
      instructions: properties.segments[0]?.steps?.map((step: any) => ({
        text: step.instruction,
        distance: step.distance,
        duration: step.duration,
        coordinate: step.way_points ? feature.geometry.coordinates[step.way_points[0]] : [0, 0]
      })) || [],
      restrictions: this.parseOpenRouteWarnings(properties.warnings || []),
      warnings: properties.warnings?.map((w: any) => w.message) || []
    };
  }
  
  private parseHereRestrictions(notices: any[]): RouteRestriction[] {
    return notices.filter(n => n.severity === 'warning').map(notice => ({
      type: this.mapHereNoticeType(notice.code),
      description: notice.title,
      coordinate: notice.location ? [notice.location[1], notice.location[0]] : [0, 0],
      severity: 'warning' as const
    }));
  }
  
  private parseOpenRouteWarnings(warnings: any[]): RouteRestriction[] {
    return warnings.map(warning => ({
      type: 'weight' as const, // Type générique
      description: warning.message,
      coordinate: [0, 0], // OpenRoute ne fournit pas toujours les coordonnées
      severity: 'warning' as const
    }));
  }
  
  private mapHereNoticeType(code: string): RouteRestriction['type'] {
    const mapping: { [key: string]: RouteRestriction['type'] } = {
      'weightRestriction': 'weight',
      'heightRestriction': 'height',
      'widthRestriction': 'width',
      'lengthRestriction': 'length',
      'tunnelRestriction': 'tunnel',
      'bridgeRestriction': 'bridge',
      'hazmatRestriction': 'hazmat'
    };
    return mapping[code] || 'weight';
  }
  
  private parseHereTolls(tolls: any): TollInfo {
    return {
      totalCost: tolls.totalCost?.value || 0,
      currency: tolls.totalCost?.currency || 'EUR',
      sections: tolls.tollSystems?.map((system: any) => ({
        name: system.name,
        cost: system.cost?.value || 0,
        distance: system.length || 0
      })) || []
    };
  }
  
  private generateHeavyVehicleRestrictions(
    route: any, 
    options: HeavyVehicleRouteOptions
  ): RouteRestriction[] {
    const restrictions: RouteRestriction[] = [];
    
    // Simuler des restrictions communes sur les autoroutes françaises
    if (options.weight > 44) {
      restrictions.push({
        type: 'weight',
        description: `Poids de ${options.weight}t supérieur à la limite standard de 44t`,
        coordinate: [0, 0],
        severity: 'error'
      });
    }
    
    if (options.height && options.height > 4.0) {
      restrictions.push({
        type: 'height',
        description: `Hauteur de ${options.height}m pouvant poser problème sous certains ponts`,
        coordinate: [0, 0],
        severity: 'warning'
      });
    }
    
    return restrictions;
  }
  
  private convertGoogleInstructions(steps: any[]): RouteInstruction[] {
    return steps.map(step => ({
      text: step.html_instructions.replace(/<[^>]*>/g, ''), // Supprimer les balises HTML
      distance: step.distance.value,
      duration: step.duration.value,
      coordinate: [step.end_location.lng, step.end_location.lat]
    }));
  }
  
  private encodePolyline(coordinates: number[][]): string {
    // Implémentation simple d'encodage polyline
    // En production, utiliser une bibliothèque dédiée comme @mapbox/polyline
    return coordinates.map(coord => `${coord[1]},${coord[0]}`).join('|');
  }
  
  /**
   * Vérifie si un véhicule nécessite un routage spécialisé
   */
  isHeavyVehicle(vehicle: any): boolean {
    // Convertir le poids depuis différents formats possibles
    const weight = this.extractVehicleWeight(vehicle);
    return weight > 19; // Plus de 19 tonnes
  }
  
  /**
   * Extrait le poids d'un véhicule depuis ses données
   */
  extractVehicleWeight(vehicle: any): number {
    // Essayer différents champs possibles
    if (vehicle.weight) return parseFloat(vehicle.weight);
    if (vehicle.maxWeight) return parseFloat(vehicle.maxWeight);
    if (vehicle.grossWeight) return parseFloat(vehicle.grossWeight);
    if (vehicle.gvw) return parseFloat(vehicle.gvw);
    
    // Parser depuis les catégories ou types
    if (vehicle.category) {
      const category = vehicle.category.toLowerCase();
      if (category.includes('poids lourd') || category.includes('truck')) {
        return 25; // Estimation par défaut pour poids lourd
      }
    }
    
    // Valeur par défaut pour véhicule léger
    return 3.5;
  }
  
  /**
   * Génère les options de véhicule depuis les données
   */
  buildVehicleOptions(vehicle: any): HeavyVehicleRouteOptions {
    return {
      weight: this.extractVehicleWeight(vehicle),
      height: vehicle.height ? parseFloat(vehicle.height) : 4.0,
      width: vehicle.width ? parseFloat(vehicle.width) : 2.55,
      length: vehicle.length ? parseFloat(vehicle.length) : 16.5,
      axleLoad: vehicle.axleLoad ? parseFloat(vehicle.axleLoad) : undefined,
      hazmat: vehicle.hazmat || false,
      avoidTolls: false, // Par défaut, peut être configuré par l'utilisateur
      avoidFerries: false
    };
  }

  /**
   * Encode une géométrie GeoJSON en polyline simple
   */
  private encodePolylineFromGeojson(geometry: any): string {
    if (!geometry || !geometry.coordinates) {
      return '';
    }
    
    // Convertir les coordonnées GeoJSON en string simple
    return geometry.coordinates
      .map((coord: number[]) => `${coord[1]},${coord[0]}`) // Inverser lng,lat -> lat,lng
      .join('|');
  }

  /**
   * Convertit les instructions OSRM en format standardisé
   */
  private convertOSRMInstructions(steps: any[]): RouteInstruction[] {
    return steps.map(step => ({
      text: step.maneuver?.instruction || `Continuer sur ${step.name || 'la route'}`,
      distance: step.distance || 0,
      duration: step.duration || 0,
      coordinate: step.maneuver?.location || [0, 0]
    }));
  }

  /**
   * Calcule la distance entre deux points avec la formule haversine
   */
  private calculateHaversineDistance(
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

    return R * c; // Distance en mètres
  }

  /**
   * Génère des restrictions simulées basées sur les caractéristiques du véhicule
   */
  private generateSimulatedRestrictions(options: HeavyVehicleRouteOptions): RouteRestriction[] {
    const restrictions: RouteRestriction[] = [];
    
    // Restrictions de poids
    if (options.weight > 44) {
      restrictions.push({
        type: 'weight',
        description: `Poids de ${options.weight}t > limite légale 44t - Autorisation exceptionnelle requise`,
        coordinate: [0, 0],
        severity: 'error'
      });
    } else if (options.weight > 40) {
      restrictions.push({
        type: 'weight',
        description: `Poids élevé ${options.weight}t - Vérifier les limitations locales`,
        coordinate: [0, 0],
        severity: 'warning'
      });
    }
    
    // Restrictions de hauteur
    if (options.height && options.height > 4.0) {
      restrictions.push({
        type: 'height',
        description: `Hauteur ${options.height}m > standard 4.0m - Attention aux ponts`,
        coordinate: [0, 0],
        severity: options.height > 4.5 ? 'error' : 'warning'
      });
    }
    
    // Restrictions de largeur
    if (options.width && options.width > 2.55) {
      restrictions.push({
        type: 'width',
        description: `Largeur ${options.width}m > standard 2.55m - Convoi exceptionnel`,
        coordinate: [0, 0],
        severity: 'error'
      });
    }
    
    // Restrictions de longueur
    if (options.length && options.length > 16.5) {
      restrictions.push({
        type: 'length',
        description: `Longueur ${options.length}m > standard 16.5m - Autorisation requise`,
        coordinate: [0, 0],
        severity: 'error'
      });
    }
    
    // Matières dangereuses
    if (options.hazmat) {
      restrictions.push({
        type: 'hazmat',
        description: `Transport matières dangereuses - Restrictions tunnels et centres-villes`,
        coordinate: [0, 0],
        severity: 'warning'
      });
    }
    
    return restrictions;
  }
}

export const heavyVehicleRouteService = new HeavyVehicleRouteService();