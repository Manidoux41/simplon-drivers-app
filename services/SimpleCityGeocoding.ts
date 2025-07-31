/**
 * Service de géocodage simple avec base de données de villes françaises
 * Utilisé comme fallback quand l'API de géocodage échoue
 */

export interface SimpleGeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  isApproximate: boolean;
}

// Base de données simplifiée des principales villes françaises
const FRANCE_CITIES: { [key: string]: { lat: number; lng: number; name: string } } = {
  // Principales métropoles
  'paris': { lat: 48.8566, lng: 2.3522, name: 'Paris' },
  'marseille': { lat: 43.2965, lng: 5.3698, name: 'Marseille' },
  'lyon': { lat: 45.7640, lng: 4.8357, name: 'Lyon' },
  'toulouse': { lat: 43.6047, lng: 1.4442, name: 'Toulouse' },
  'nice': { lat: 43.7102, lng: 7.2620, name: 'Nice' },
  'nantes': { lat: 47.2184, lng: -1.5536, name: 'Nantes' },
  'montpellier': { lat: 43.6110, lng: 3.8767, name: 'Montpellier' },
  'strasbourg': { lat: 48.5734, lng: 7.7521, name: 'Strasbourg' },
  'bordeaux': { lat: 44.8378, lng: -0.5792, name: 'Bordeaux' },
  'lille': { lat: 50.6292, lng: 3.0573, name: 'Lille' },
  'rennes': { lat: 48.1173, lng: -1.6778, name: 'Rennes' },
  'reims': { lat: 49.2583, lng: 4.0317, name: 'Reims' },
  'saint-etienne': { lat: 45.4397, lng: 4.3872, name: 'Saint-Étienne' },
  'toulon': { lat: 43.1242, lng: 5.9280, name: 'Toulon' },
  'grenoble': { lat: 45.1885, lng: 5.7245, name: 'Grenoble' },
  'dijon': { lat: 47.3220, lng: 5.0415, name: 'Dijon' },
  'angers': { lat: 47.4784, lng: -0.5632, name: 'Angers' },
  'nimes': { lat: 43.8367, lng: 4.3601, name: 'Nîmes' },
  'villeurbanne': { lat: 45.7665, lng: 4.8795, name: 'Villeurbanne' },
  'aix-en-provence': { lat: 43.5297, lng: 5.4474, name: 'Aix-en-Provence' },
  
  // Région parisienne
  'versailles': { lat: 48.8014, lng: 2.1301, name: 'Versailles' },
  'boulogne': { lat: 48.8356, lng: 2.2397, name: 'Boulogne-Billancourt' },
  'montreuil': { lat: 48.8638, lng: 2.4478, name: 'Montreuil' },
  'argenteuil': { lat: 48.9474, lng: 2.2482, name: 'Argenteuil' },
  'vincennes': { lat: 48.8479, lng: 2.4393, name: 'Vincennes' },
  
  // Autres villes importantes
  'clermont-ferrand': { lat: 45.7772, lng: 3.0870, name: 'Clermont-Ferrand' },
  'tours': { lat: 47.3941, lng: 0.6848, name: 'Tours' },
  'amiens': { lat: 49.8941, lng: 2.2957, name: 'Amiens' },
  'limoges': { lat: 45.8336, lng: 1.2611, name: 'Limoges' },
  'brest': { lat: 48.3904, lng: -4.4861, name: 'Brest' },
  'metz': { lat: 49.1193, lng: 6.1757, name: 'Metz' },
  'perpignan': { lat: 42.6886, lng: 2.8946, name: 'Perpignan' },
  'orleans': { lat: 47.9029, lng: 1.9039, name: 'Orléans' },
  'besancon': { lat: 47.2380, lng: 6.0243, name: 'Besançon' },
  'caen': { lat: 49.1829, lng: -0.3707, name: 'Caen' },
  'rouen': { lat: 49.4431, lng: 1.0993, name: 'Rouen' },
  'nancy': { lat: 48.6921, lng: 6.1844, name: 'Nancy' },
  'poitiers': { lat: 46.5802, lng: 0.3404, name: 'Poitiers' },
  'avignon': { lat: 43.9493, lng: 4.8055, name: 'Avignon' },
  'la-rochelle': { lat: 46.1603, lng: -1.1511, name: 'La Rochelle' },
  'calais': { lat: 50.9513, lng: 1.8587, name: 'Calais' },
  'dunkerque': { lat: 51.0342, lng: 2.3770, name: 'Dunkerque' },
};

export class SimpleCityGeocoding {
  /**
   * Essaie de géocoder une adresse en cherchant le nom de ville
   */
  static geocodeByCity(address: string): SimpleGeocodingResult | null {
    if (!address || address.length < 3) {
      return null;
    }

    const normalizedAddress = address.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n');

    // Chercher une correspondance exacte d'abord
    for (const [cityKey, cityData] of Object.entries(FRANCE_CITIES)) {
      if (normalizedAddress.includes(cityKey)) {
        console.log(`📍 Ville trouvée: ${cityData.name} pour adresse: ${address}`);
        return {
          latitude: cityData.lat,
          longitude: cityData.lng,
          address: `${address} (approximatif - ${cityData.name})`,
          isApproximate: true,
        };
      }
    }

    // Chercher une correspondance partielle
    for (const [cityKey, cityData] of Object.entries(FRANCE_CITIES)) {
      const cityWords = cityKey.split('-');
      const addressWords = normalizedAddress.split(/\s+|,|-/);
      
      for (const cityWord of cityWords) {
        if (cityWord.length >= 4 && addressWords.some(word => word.includes(cityWord))) {
          console.log(`📍 Correspondance partielle: ${cityData.name} pour adresse: ${address}`);
          return {
            latitude: cityData.lat,
            longitude: cityData.lng,
            address: `${address} (approximatif - ${cityData.name})`,
            isApproximate: true,
          };
        }
      }
    }

    console.warn('❌ Aucune ville reconnue dans:', address);
    return null;
  }

  /**
   * Fallback avec position par défaut si aucune ville n'est trouvée
   */
  static getFallbackLocation(address: string): SimpleGeocodingResult {
    console.warn('🚫 Utilisation du fallback Paris pour:', address);
    return {
      latitude: 48.8566,
      longitude: 2.3522,
      address: `${address} (position par défaut - Paris)`,
      isApproximate: true,
    };
  }

  /**
   * Géocodage intelligent avec fallback progressif
   */
  static intelligentGeocode(address: string): SimpleGeocodingResult {
    // Essayer de trouver une ville d'abord
    const cityResult = this.geocodeByCity(address);
    if (cityResult) {
      return cityResult;
    }

    // Fallback vers Paris si rien trouvé
    return this.getFallbackLocation(address);
  }
}
