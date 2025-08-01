/**
 * Service de géocodage utilisant l'API gouvernementale française
 * API officielle des communes françaises avec couverture complète
 */

export interface FrenchCityResult {
  latitude: number;
  longitude: number;
  address: string;
  isApproximate: boolean;
  cityName: string;
  postalCode?: string;
  population?: number;
}

export class FrenchCityAPI {
  private static readonly BASE_URL = 'https://geo.api.gouv.fr';
  private static cityCache = new Map<string, FrenchCityResult>();
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 100; // 100ms entre les requêtes

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
   * Recherche une ville française par nom
   */
  static async searchCity(cityName: string): Promise<FrenchCityResult | null> {
    if (!cityName || cityName.length < 2) {
      return null;
    }

    const normalizedCityName = this.normalizeCityName(cityName);
    
    // Vérifier le cache
    if (this.cityCache.has(normalizedCityName)) {
      console.log('📍 Cache hit pour:', cityName);
      return this.cityCache.get(normalizedCityName)!;
    }

    try {
      await this.waitForRateLimit();
      
      console.log('🌍 Recherche API gouv.fr pour:', cityName);
      
      // Recherche par nom de commune
      const searchUrl = `${this.BASE_URL}/communes?nom=${encodeURIComponent(cityName)}&fields=nom,code,codesPostaux,centre,population&format=json&geometry=centre`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.warn('⚠️ Erreur API gouv.fr:', response.status);
        return null;
      }

      const communes = await response.json();
      
      if (communes && communes.length > 0) {
        // Prendre la première commune (plus peuplée généralement)
        const commune = communes[0];
        
        if (commune.centre && commune.centre.coordinates) {
          const [longitude, latitude] = commune.centre.coordinates;
          
          const result: FrenchCityResult = {
            latitude,
            longitude,
            address: `${cityName} (${commune.nom})`,
            isApproximate: true,
            cityName: commune.nom,
            postalCode: commune.codesPostaux?.[0],
            population: commune.population,
          };

          // Mettre en cache
          this.cityCache.set(normalizedCityName, result);
          
          console.log(`✅ Ville trouvée: ${commune.nom} (${latitude}, ${longitude}) - ${commune.population} hab.`);
          return result;
        }
      }

      console.warn('⚠️ Aucune commune trouvée pour:', cityName);
      return null;
      
    } catch (error) {
      console.error('❌ Erreur API gouv.fr:', error);
      return null;
    }
  }

  /**
   * Recherche intelligente dans un texte contenant potentiellement un nom de ville
   */
  static async searchCityInText(text: string): Promise<FrenchCityResult | null> {
    if (!text || text.length < 3) {
      return null;
    }

    const words = this.extractPotentialCityNames(text);
    
    // Tester chaque mot potentiel
    for (const word of words) {
      if (word.length >= 3) {
        const result = await this.searchCity(word);
        if (result) {
          // Ajuster l'adresse pour inclure le texte original
          result.address = `${text} (${result.cityName})`;
          return result;
        }
      }
    }

    // Si aucun mot individuel ne fonctionne, essayer des combinaisons
    const combinations = this.generateCityCombinations(words);
    for (const combination of combinations) {
      const result = await this.searchCity(combination);
      if (result) {
        result.address = `${text} (${result.cityName})`;
        return result;
      }
    }

    return null;
  }

  /**
   * Extrait les mots qui pourraient être des noms de villes
   */
  private static extractPotentialCityNames(text: string): string[] {
    const normalized = this.normalizeCityName(text);
    
    // Mots à ignorer (mots communs qui ne sont pas des villes)
    const stopWords = new Set([
      'ecole', 'primaire', 'college', 'lycee', 'mairie', 'centre', 'ville',
      'rue', 'avenue', 'place', 'boulevard', 'chemin', 'route', 'voie',
      'nord', 'sud', 'est', 'ouest', 'haut', 'bas', 'grand', 'petit',
      'nouveau', 'vieux', 'saint', 'sainte'
    ]);

    const words = normalized
      .split(/[\s\-,\.]+/)
      .filter(word => word.length >= 3 && !stopWords.has(word))
      .filter(word => /^[a-z]+$/.test(word)); // Seulement les mots avec des lettres

    return words;
  }

  /**
   * Génère des combinaisons de mots pour les villes composées
   */
  private static generateCityCombinations(words: string[]): string[] {
    const combinations: string[] = [];
    
    // Combinaisons de 2 mots adjacents
    for (let i = 0; i < words.length - 1; i++) {
      combinations.push(`${words[i]} ${words[i + 1]}`);
      combinations.push(`${words[i]}-${words[i + 1]}`);
    }
    
    // Combinaisons de 3 mots adjacents
    for (let i = 0; i < words.length - 2; i++) {
      combinations.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      combinations.push(`${words[i]}-${words[i + 1]}-${words[i + 2]}`);
    }
    
    return combinations;
  }

  /**
   * Normalise un nom de ville pour la recherche
   */
  private static normalizeCityName(cityName: string): string {
    return cityName
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/'/g, ' ')
      .replace(/\s+/g, ' ');
  }

  /**
   * Recherche par code postal
   */
  static async searchByPostalCode(postalCode: string): Promise<FrenchCityResult[]> {
    try {
      await this.waitForRateLimit();
      
      const searchUrl = `${this.BASE_URL}/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux,centre,population&format=json&geometry=centre`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) return [];

      const communes = await response.json();
      
      return communes
        .filter((commune: any) => commune.centre?.coordinates)
        .map((commune: any) => {
          const [longitude, latitude] = commune.centre.coordinates;
          return {
            latitude,
            longitude,
            address: `${commune.nom} (${postalCode})`,
            isApproximate: true,
            cityName: commune.nom,
            postalCode,
            population: commune.population,
          };
        });
        
    } catch (error) {
      console.error('❌ Erreur recherche code postal:', error);
      return [];
    }
  }

  /**
   * Vide le cache
   */
  static clearCache(): void {
    this.cityCache.clear();
    console.log('🗑️ Cache villes françaises vidé');
  }

  /**
   * Statistiques du cache
   */
  static getCacheStats(): { size: number; cities: string[] } {
    return {
      size: this.cityCache.size,
      cities: Array.from(this.cityCache.keys()),
    };
  }
}
