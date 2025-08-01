import { FrenchCityAPI } from './FrenchCityAPI';

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
  
  // Villes du Centre-Val de Loire
  'blois': { lat: 47.5867, lng: 1.3350, name: 'Blois' },
  'chartres': { lat: 48.4430, lng: 1.4900, name: 'Chartres' },
  'chateauroux': { lat: 46.8108, lng: 1.6908, name: 'Châteauroux' },
  'dreux': { lat: 48.7361, lng: 1.3658, name: 'Dreux' },
  'vendome': { lat: 47.7936, lng: 1.0677, name: 'Vendôme' },
  'mondoubleau': { lat: 47.9767, lng: 0.8833, name: 'Mondoubleau' },
  'moragne': { lat: 47.9500, lng: 0.9000, name: 'Moragnes' },
  'salbris': { lat: 47.4262, lng: 2.0540, name: 'Salbris' },
  'romorantin': { lat: 47.3545, lng: 1.7395, name: 'Romorantin-Lanthenay' },
  'issoudun': { lat: 46.9479, lng: 1.9926, name: 'Issoudun' },
  
  // Villes de Normandie
  'le-havre': { lat: 49.4944, lng: 0.1079, name: 'Le Havre' },
  'cherbourg': { lat: 49.6337, lng: -1.6222, name: 'Cherbourg-en-Cotentin' },
  'evreux': { lat: 49.0247, lng: 1.1508, name: 'Évreux' },
  'lisieux': { lat: 49.1431, lng: 0.2255, name: 'Lisieux' },
  'bayeux': { lat: 49.2764, lng: -0.7028, name: 'Bayeux' },
  'flers': { lat: 48.7503, lng: -0.5706, name: 'Flers' },
  'alencon': { lat: 48.4307, lng: 0.0910, name: 'Alençon' },
  
  // Villes de Bretagne
  'quimper': { lat: 47.9960, lng: -4.1026, name: 'Quimper' },
  'lorient': { lat: 47.7485, lng: -3.3668, name: 'Lorient' },
  'vannes': { lat: 47.6587, lng: -2.7603, name: 'Vannes' },
  'saint-malo': { lat: 48.6500, lng: -2.0250, name: 'Saint-Malo' },
  'saint-brieuc': { lat: 48.5140, lng: -2.7650, name: 'Saint-Brieuc' },
  'lannion': { lat: 48.7322, lng: -3.4594, name: 'Lannion' },
  'morlaix': { lat: 48.5794, lng: -3.8281, name: 'Morlaix' },
  'pontivy': { lat: 48.0667, lng: -2.9667, name: 'Pontivy' },
  
  // Villes des Pays de la Loire
  'le-mans': { lat: 47.9980, lng: 0.1954, name: 'Le Mans' },
  'saint-nazaire': { lat: 47.2733, lng: -2.2134, name: 'Saint-Nazaire' },
  'laval': { lat: 48.0698, lng: -0.7700, name: 'Laval' },
  'cholet': { lat: 47.0586, lng: -0.8780, name: 'Cholet' },
  'saumur': { lat: 47.2600, lng: -0.0783, name: 'Saumur' },
  'mayenne': { lat: 48.3000, lng: -0.6167, name: 'Mayenne' },
  'la-roche-sur-yon': { lat: 46.6702, lng: -1.4267, name: 'La Roche-sur-Yon' },
  'les-sables-d-olonne': { lat: 46.4967, lng: -1.7833, name: 'Les Sables-d\'Olonne' },
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
      .replace(/[ñ]/g, 'n')
      .replace(/'/g, '-')
      .replace(/\s+/g, '-');

    console.log('🔍 Recherche normalisée:', normalizedAddress);

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

    // Chercher une correspondance partielle avec les mots de la ville
    for (const [cityKey, cityData] of Object.entries(FRANCE_CITIES)) {
      const cityWords = cityKey.split('-');
      const addressWords = normalizedAddress.split(/[-\s,]+/);
      
      for (const cityWord of cityWords) {
        if (cityWord.length >= 4) {
          for (const addressWord of addressWords) {
            // Correspondance exacte d'un mot
            if (addressWord === cityWord) {
              console.log(`📍 Correspondance exacte mot: ${cityData.name} pour adresse: ${address} (mot: ${cityWord})`);
              return {
                latitude: cityData.lat,
                longitude: cityData.lng,
                address: `${address} (approximatif - ${cityData.name})`,
                isApproximate: true,
              };
            }
            // Correspondance partielle (mot contient le nom de ville)
            if (addressWord.length >= 6 && addressWord.includes(cityWord)) {
              console.log(`📍 Correspondance partielle: ${cityData.name} pour adresse: ${address} (mot: ${cityWord} dans ${addressWord})`);
              return {
                latitude: cityData.lat,
                longitude: cityData.lng,
                address: `${address} (approximatif - ${cityData.name})`,
                isApproximate: true,
              };
            }
          }
        }
      }
    }

    // Recherche fuzzy pour les fautes de frappe courantes
    for (const [cityKey, cityData] of Object.entries(FRANCE_CITIES)) {
      const addressWords = normalizedAddress.split(/[-\s,]+/);
      
      for (const addressWord of addressWords) {
        if (addressWord.length >= 5) {
          // Vérifier la distance de Levenshtein pour les fautes de frappe
          if (this.isCloseMatch(addressWord, cityKey)) {
            console.log(`📍 Correspondance approximative: ${cityData.name} pour adresse: ${address} (${addressWord} ≈ ${cityKey})`);
            return {
              latitude: cityData.lat,
              longitude: cityData.lng,
              address: `${address} (approximatif - ${cityData.name})`,
              isApproximate: true,
            };
          }
        }
      }
    }

    console.warn('❌ Aucune ville reconnue dans:', address);
    return null;
  }

  /**
   * Vérifie si deux mots sont suffisamment proches (distance de Levenshtein simplifiée)
   */
  private static isCloseMatch(word1: string, word2: string): boolean {
    if (Math.abs(word1.length - word2.length) > 2) {
      return false;
    }
    
    // Vérifier si au moins 80% des caractères correspondent
    const minLength = Math.min(word1.length, word2.length);
    let matches = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (word1[i] === word2[i]) {
        matches++;
      }
    }
    
    return (matches / minLength) >= 0.8;
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
   * Géocodage intelligent avec API complète des villes françaises
   */
  static async intelligentGeocodeWithAPI(address: string): Promise<SimpleGeocodingResult> {
    // Essayer d'abord la base de données locale (plus rapide)
    const localResult = this.geocodeByCity(address);
    if (localResult) {
      console.log('📍 Trouvé dans base locale:', localResult.address);
      return localResult;
    }

    // Essayer l'API gouvernementale française
    console.log('🌍 Recherche via API gouv.fr...');
    try {
      const apiResult = await FrenchCityAPI.searchCityInText(address);
      if (apiResult) {
        console.log('✅ Trouvé via API gouv.fr:', apiResult.cityName);
        return {
          latitude: apiResult.latitude,
          longitude: apiResult.longitude,
          address: apiResult.address,
          isApproximate: apiResult.isApproximate,
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur API gouv.fr:', error);
    }

    // Fallback vers Paris si rien trouvé
    return this.getFallbackLocation(address);
  }

  /**
   * Géocodage intelligent avec fallback progressif (version synchrone pour compatibilité)
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
