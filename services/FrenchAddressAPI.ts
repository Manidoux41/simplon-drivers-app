/**
 * Service de géocodage pour adresses complètes
 * Utilise l'API Adresse française (data.gouv.fr) pour des résultats précis
 */

export interface AddressResult {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  postalCode?: string;
  street?: string;
  houseNumber?: string;
  score?: number;
}

export interface SearchSuggestion {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  postalCode: string;
  context: string;
  score: number;
}

export class FrenchAddressAPI {
  private static readonly BASE_URL = 'https://api-adresse.data.gouv.fr';
  private static cache = new Map<string, SearchSuggestion[]>();
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 300; // 300ms entre requêtes

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
   * Recherche d'adresses avec autocomplétion
   */
  static async searchAddresses(query: string, limit: number = 8): Promise<SearchSuggestion[]> {
    if (query.length < 3) {
      return [];
    }

    const cacheKey = `${query.toLowerCase()}_${limit}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      await this.waitForRateLimit();

      // Nettoyer la requête
      const cleanQuery = query.trim().replace(/\s+/g, ' ');

      const params = new URLSearchParams({
        q: cleanQuery,
        limit: Math.min(limit, 15).toString(), // Limiter à 15 max
        autocomplete: '1'
        // Retirer le type qui peut causer des erreurs
      });

      console.log('🔍 Recherche adresse:', cleanQuery);
      
      const response = await fetch(`${this.BASE_URL}/search/?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SimplonDriversApp/1.0'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ API réponse ${response.status}: ${response.statusText}`);
        // Essayer avec un fallback plus simple
        return await this.fallbackSearch(cleanQuery, limit);
      }

      const data = await response.json();
      
      const results: SearchSuggestion[] = data.features?.map((feature: any, index: number) => ({
        id: feature.properties.id || `result_${index}`,
        address: feature.properties.label || '',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        city: feature.properties.city || '',
        postalCode: feature.properties.postcode || '',
        context: feature.properties.context || '',
        score: feature.properties.score || 0
      })) || [];

      // Mettre en cache
      this.cache.set(cacheKey, results);
      
      console.log(`✅ Trouvé ${results.length} adresses pour "${cleanQuery}"`);
      return results;

    } catch (error) {
      console.error('❌ Erreur recherche adresse:', error);
      return await this.fallbackSearch(query, limit);
    }
  }

  /**
   * Recherche de fallback avec paramètres simplifiés
   */
  private static async fallbackSearch(query: string, limit: number): Promise<SearchSuggestion[]> {
    try {
      console.log('🔄 Tentative fallback pour:', query);
      
      const params = new URLSearchParams({
        q: query,
        limit: '5'
      });

      const response = await fetch(`${this.BASE_URL}/search/?${params}`);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      const results: SearchSuggestion[] = data.features?.map((feature: any, index: number) => ({
        id: feature.properties.id || `fallback_${index}`,
        address: feature.properties.label || query,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        city: feature.properties.city || '',
        postalCode: feature.properties.postcode || '',
        context: feature.properties.context || 'Résultat approximatif',
        score: (feature.properties.score || 0.5) * 0.8 // Score réduit pour fallback
      })) || [];

      return results;

    } catch (fallbackError) {
      console.error('❌ Erreur fallback:', fallbackError);
      return [];
    }
  }

  /**
   * Géocodage inverse - obtenir l'adresse depuis des coordonnées
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<AddressResult | null> {
    try {
      await this.waitForRateLimit();

      const params = new URLSearchParams({
        lat: latitude.toFixed(6),
        lon: longitude.toFixed(6)
        // Retirer le type qui peut causer des erreurs
      });

      console.log('🔄 Géocodage inverse:', latitude, longitude);
      
      const response = await fetch(`${this.BASE_URL}/reverse/?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SimplonDriversApp/1.0'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Géocodage inverse ${response.status}: ${response.statusText}`);
        return {
          address: `Position ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          latitude,
          longitude,
          city: 'Position sélectionnée',
          postalCode: '',
          score: 0.5
        };
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        
        return {
          address: feature.properties.label || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          city: feature.properties.city || '',
          postalCode: feature.properties.postcode || '',
          street: feature.properties.name || '',
          houseNumber: feature.properties.housenumber || '',
          score: feature.properties.score || 0.7
        };
      }

      // Fallback si pas de résultat
      return {
        address: `Position ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
        city: 'Position sélectionnée',
        postalCode: '',
        score: 0.5
      };

    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      // Retourner une adresse par défaut
      return {
        address: `Position ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
        city: 'Position sélectionnée',
        postalCode: '',
        score: 0.3
      };
    }
  }

  /**
   * Géocodage d'une adresse complète
   */
  static async geocodeAddress(address: string): Promise<AddressResult | null> {
    try {
      const suggestions = await this.searchAddresses(address, 1);
      
      if (suggestions.length > 0) {
        const best = suggestions[0];
        return {
          address: best.address,
          latitude: best.latitude,
          longitude: best.longitude,
          city: best.city,
          postalCode: best.postalCode,
          score: best.score
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Erreur géocodage adresse:', error);
      return null;
    }
  }

  /**
   * Vider le cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache adresses vidé');
  }

  /**
   * Statistiques du cache
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Recherche avec tolérance aux fautes de frappe
   */
  static async fuzzySearch(query: string, limit: number = 5): Promise<SearchSuggestion[]> {
    // Nettoyage de base
    const cleanQuery = query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ');

    // Recherche normale
    let results = await this.searchAddresses(cleanQuery, limit);
    
    if (results.length === 0 && cleanQuery.length > 5) {
      // Essayer des variantes
      const variants = [
        cleanQuery.replace(/st\b/g, 'saint'),
        cleanQuery.replace(/ste\b/g, 'sainte'),
        cleanQuery.replace(/av\b/g, 'avenue'),
        cleanQuery.replace(/bd\b/g, 'boulevard'),
        cleanQuery.replace(/r\b/g, 'rue'),
        cleanQuery.replace(/pl\b/g, 'place')
      ];

      for (const variant of variants) {
        if (variant !== cleanQuery) {
          results = await this.searchAddresses(variant, limit);
          if (results.length > 0) break;
        }
      }
    }

    return results;
  }

  /**
   * Validation d'une adresse
   */
  static async validateAddress(address: string): Promise<{
    isValid: boolean;
    score: number;
    correctedAddress?: string;
    coordinates?: { latitude: number; longitude: number };
  }> {
    try {
      const result = await this.geocodeAddress(address);
      
      if (result && result.score && result.score > 0.5) {
        return {
          isValid: true,
          score: result.score,
          correctedAddress: result.address,
          coordinates: {
            latitude: result.latitude,
            longitude: result.longitude
          }
        };
      }

      return {
        isValid: false,
        score: result?.score || 0
      };

    } catch (error) {
      console.error('❌ Erreur validation adresse:', error);
      return {
        isValid: false,
        score: 0
      };
    }
  }
}
