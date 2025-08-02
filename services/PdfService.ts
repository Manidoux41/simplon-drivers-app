import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Mission as DatabaseMission } from '../lib/database';
import { Mission as TypesMission } from '../lib/types';
import { DateUtils } from '../utils/dateUtils';
import { MapUtils } from '../utils/mapUtils';

// Type union pour accepter les deux formats de Mission
type MissionType = DatabaseMission | TypesMission;

export interface MissionPdfData {
  mission: MissionType;
  companyName?: string;
  driverName?: string;
  vehicleInfo?: string;
}

export class PdfService {
  /**
   * Convertit une date en string si nécessaire
   */
  private static formatDateString(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return date.toISOString();
  }

  /**
   * Génère un PDF pour les détails d'une mission
   */
  static async generateMissionPdf(data: MissionPdfData): Promise<string> {
    const { mission, companyName = 'Entreprise inconnue', driverName = 'Chauffeur non assigné', vehicleInfo = 'Véhicule non assigné' } = data;
    
    // Calcul de la distance si non disponible
    const distance = mission.distance || MapUtils.calculateDistance(
      { latitude: mission.departureLat, longitude: mission.departureLng },
      { latitude: mission.arrivalLat, longitude: mission.arrivalLng }
    );

    // Génération du HTML pour le PDF
    const html = this.generateMissionHtml({
      mission,
      companyName,
      driverName,
      vehicleInfo,
      distance: parseFloat(distance.toFixed(2))
    });

    try {
      // Génération du PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 595, // A4 width in points
        height: 842, // A4 height in points
      });

      return uri;
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw new Error('Impossible de générer le PDF de la mission');
    }
  }

  /**
   * Partage le PDF généré
   */
  static async shareMissionPdf(data: MissionPdfData): Promise<void> {
    try {
      const pdfUri = await this.generateMissionPdf(data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Mission ${data.mission.title} - Détails`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        throw new Error('Le partage n\'est pas disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur partage PDF:', error);
      throw error;
    }
  }

  /**
   * Imprime directement la mission
   */
  static async printMissionDirect(data: MissionPdfData): Promise<void> {
    const { mission, companyName = 'Entreprise inconnue', driverName = 'Chauffeur non assigné', vehicleInfo = 'Véhicule non assigné' } = data;
    
    // Calcul de la distance si non disponible
    const distance = mission.distance || MapUtils.calculateDistance(
      { latitude: mission.departureLat, longitude: mission.departureLng },
      { latitude: mission.arrivalLat, longitude: mission.arrivalLng }
    );

    // Génération du HTML pour l'impression
    const html = this.generateMissionHtml({
      mission,
      companyName,
      driverName,
      vehicleInfo,
      distance: parseFloat(distance.toFixed(2))
    });

    try {
      await Print.printAsync({
        html,
        printerUrl: undefined, // Laisser l'utilisateur choisir l'imprimante
      });
    } catch (error) {
      console.error('Erreur impression directe:', error);
      throw new Error('Impossible d\'imprimer la mission');
    }
  }

  /**
   * Génère le HTML stylisé pour le PDF/impression
   */
  private static generateMissionHtml(data: {
    mission: MissionType;
    companyName: string;
    driverName: string;
    vehicleInfo: string;
    distance: number;
  }): string {
    const { mission, companyName, driverName, vehicleInfo, distance } = data;

    const statusLabels: Record<string, string> = {
      'PENDING': 'En attente',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminée',
      'CANCELLED': 'Annulée'
    };

    const statusColors: Record<string, string> = {
      'PENDING': '#f59e0b',
      'IN_PROGRESS': '#3b82f6',
      'COMPLETED': '#10b981',
      'CANCELLED': '#ef4444'
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mission ${mission.title} - Détails</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        .subtitle {
            color: #666;
            font-size: 14px;
        }
        
        .mission-title {
            font-size: 28px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            color: #1f2937;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            color: white;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 20px;
            background-color: ${statusColors[mission.status] || '#6b7280'};
        }
        
        .section {
            margin: 25px 0;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background-color: #f9fafb;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        
        .info-item {
            padding: 10px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
        }
        
        .info-label {
            font-size: 12px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 14px;
            color: #1f2937;
            font-weight: 500;
        }
        
        .location-section {
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            background: white;
            border: 2px solid #e5e7eb;
        }
        
        .location-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .location-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .departure-dot {
            background-color: #10b981;
        }
        
        .arrival-dot {
            background-color: #ef4444;
        }
        
        .location-label {
            font-weight: bold;
            color: #1f2937;
            font-size: 14px;
        }
        
        .location-name {
            font-size: 16px;
            font-weight: bold;
            margin: 5px 0;
            color: #1f2937;
        }
        
        .location-address {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        
        .time-info {
            font-size: 13px;
            color: #2563eb;
            font-weight: 500;
        }
        
        .description {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
            font-style: italic;
            color: #4b5563;
            margin-top: 10px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        .print-date {
            margin-top: 10px;
            font-style: italic;
        }
        
        @media print {
            body {
                padding: 10px;
            }
            
            .section {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">SIMPLON DRIVERS</div>
        <div class="subtitle">Système de gestion des missions de transport</div>
    </div>
    
    <h1 class="mission-title">${mission.title}</h1>
    <div class="status-badge">${statusLabels[mission.status] || mission.status}</div>
    
    <!-- Informations générales -->
    <div class="section">
        <h2 class="section-title">Informations générales</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Numéro de mission</div>
                <div class="info-value">${mission.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Entreprise cliente</div>
                <div class="info-value">${companyName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Chauffeur assigné</div>
                <div class="info-value">${driverName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Véhicule</div>
                <div class="info-value">${vehicleInfo}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Passagers</div>
                <div class="info-value">${mission.currentPassengers}/${mission.maxPassengers}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Distance estimée</div>
                <div class="info-value">${distance} km</div>
            </div>
        </div>
        
        ${mission.description ? `
        <div class="description">
            <strong>Description :</strong> ${mission.description}
        </div>
        ` : ''}
    </div>
    
    <!-- Itinéraire -->
    <div class="section">
        <h2 class="section-title">Itinéraire</h2>
        
        <div class="location-section">
            <div class="location-header">
                <div class="location-dot departure-dot"></div>
                <div class="location-label">DÉPART</div>
            </div>
            <div class="location-name">${mission.departureLocation}</div>
            <div class="location-address">${mission.departureAddress}</div>
            <div class="time-info">
                Programmé : ${DateUtils.formatDateTime(this.formatDateString(mission.scheduledDepartureAt))}
                ${mission.actualDepartureAt ? `<br>Réalisé : ${DateUtils.formatDateTime(this.formatDateString(mission.actualDepartureAt))}` : ''}
            </div>
        </div>
        
        <div class="location-section">
            <div class="location-header">
                <div class="location-dot arrival-dot"></div>
                <div class="location-label">ARRIVÉE</div>
            </div>
            <div class="location-name">${mission.arrivalLocation}</div>
            <div class="location-address">${mission.arrivalAddress}</div>
            <div class="time-info">
                Estimé : ${DateUtils.formatDateTime(this.formatDateString(mission.estimatedArrivalAt))}
                ${mission.actualArrivalAt ? `<br>Réalisé : ${DateUtils.formatDateTime(this.formatDateString(mission.actualArrivalAt))}` : ''}
            </div>
        </div>
    </div>
    
    <!-- Informations temporelles -->
    <div class="section">
        <h2 class="section-title">Planification</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Durée estimée</div>
                <div class="info-value">${mission.estimatedDuration ? DateUtils.formatDuration(mission.estimatedDuration) : 'Non définie'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Créée le</div>
                <div class="info-value">${DateUtils.formatDateTime(this.formatDateString(mission.createdAt))}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Dernière modification</div>
                <div class="info-value">${DateUtils.formatDateTime(this.formatDateString(mission.updatedAt))}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Statut actuel</div>
                <div class="info-value">${statusLabels[mission.status] || mission.status}</div>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <div>Document généré par Simplon Drivers</div>
        <div class="print-date">Imprimé le ${DateUtils.formatDateTime(new Date().toISOString())}</div>
    </div>
</body>
</html>`;
  }
}
