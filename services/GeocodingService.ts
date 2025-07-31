import * as Location from 'expo-location';
import { SimpleCityGeocoding } from './SimpleCityGeocoding';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  isApproximate?: boolean;
}

export class GeocodingService {
  private static geocodingCache = new Map<string, GeocodingResult>();
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 1000; // 1 seconde entre les requêtes

  /**
   * Contrôle du taux de requêtes pour éviter les erreurs de limite
   */
  private static async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const delay = this.REQUEST_DELAY - timeSinceLastRequest;
      console.log(`⏱️ Attente ${delay}ms pour respecter le rate limit`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fallback intelligent utilisant la base de données de villes
   */
  private static createFallbackResult(address: string): GeocodingResult {
    const result = SimpleCityGeocoding.intelligentGeocode(address);
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      address: result.address,
      isApproximate: result.isApproximate,
    };
  }

  /**
   * Géocode une adresse en coordonnées GPS
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim().length === 0) {
      console.warn('⚠️ Adresse vide fournie au géocodage');
      return null;
    }

    const trimmedAddress = address.trim();
    
    // Vérifier le cache d'abord
    if (this.geocodingCache.has(trimmedAddress)) {
      console.log('📍 Utilisation du cache pour:', trimmedAddress);
      return this.geocodingCache.get(trimmedAddress)!;
    }

    try {
      // Attendre avant de faire la requête
      await this.waitForRateLimit();

      console.log('🌍 Géocodage de:', trimmedAddress);
      
      const geocodedResults = await Location.geocodeAsync(trimmedAddress);
      
      if (geocodedResults && geocodedResults.length > 0) {
        const result = geocodedResults[0];
        const geocodingResult: GeocodingResult = {
          latitude: result.latitude,
          longitude: result.longitude,
          address: trimmedAddress,
          isApproximate: false,
        };

        // Mettre en cache le résultat
        this.geocodingCache.set(trimmedAddress, geocodingResult);
        console.log('✅ Géocodage réussi:', result.latitude, result.longitude);
        
        return geocodingResult;
      } else {
        console.warn('⚠️ Aucun résultat trouvé pour:', trimmedAddress);
        return this.createFallbackResult(trimmedAddress);
      }
    } catch (error) {
      console.error('❌ Erreur géocodage:', error);
      
      // Si c'est une erreur de limite, utiliser le fallback intelligent
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.warn('⚠️ Limite de géocodage atteinte, utilisation du fallback');
        return this.createFallbackResult(trimmedAddress);
      }
      
      // Pour les autres erreurs, utiliser aussi le fallback
      return this.createFallbackResult(trimmedAddress);
    }
  }

  /**
   * Géocode inverse : coordonnées vers adresse
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Attendre avant de faire la requête
      await this.waitForRateLimit();

      console.log('🌍 Géocodage inverse de:', latitude, longitude);
      
      const reverseResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseResults && reverseResults.length > 0) {
        const result = reverseResults[0];
        const address = [
          result.streetNumber,
          result.street,
          result.postalCode,
          result.city,
          result.country,
        ]
          .filter(Boolean)
          .join(' ');

        console.log('✅ Géocodage inverse réussi:', address);
        return address;
      } else {
        console.warn('⚠️ Aucun résultat trouvé pour les coordonnées:', latitude, longitude);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      
      // Si c'est une erreur de limite, retourner null
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.warn('⚠️ Limite de géocodage inverse atteinte');
        return null;
      }
      
      return null;
    }
  }

  /**
   * Obtient la position actuelle avec géocodage inverse
   */
  static async getCurrentPosition(): Promise<GeocodingResult | null> {
    try {
      console.log('📱 Demande de permissions de localisation...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ Permission de localisation refusée');
        return null;
      }

      console.log('📍 Obtention de la position actuelle...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      console.log('✅ Position obtenue:', latitude, longitude);

      // Essayer d'obtenir l'adresse
      const address = await this.reverseGeocode(latitude, longitude);
      
      return {
        latitude,
        longitude,
        address: address || 'Position actuelle',
        isApproximate: false,
      };
    } catch (error) {
      console.error('❌ Erreur position actuelle:', error);
      
      // Si c'est une erreur de limite, retourner null
      if (error instanceof Error && error.message.includes('rate limit')) {
        console.warn('⚠️ Limite de géocodage atteinte pour position actuelle');
        return null;
      }
      
      return null;
    }
  }

  /**
   * Calcule la distance entre deux points en kilomètres
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Arrondir à 2 décimales
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
