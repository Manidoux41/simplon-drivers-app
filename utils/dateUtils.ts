export class DateUtils {
  /**
   * Formate une date selon le format français DD/MM/YYYY
   */
  static formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR');
  }

  /**
   * Formate une heure selon le format HH:mm
   */
  static formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  /**
   * Formate une date et heure complète
   */
  static formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Retourne une description relative de la date (aujourd'hui, demain, hier, etc.)
   */
  static getRelativeDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (this.isSameDay(dateObj, today)) {
      return "Aujourd'hui";
    } else if (this.isSameDay(dateObj, tomorrow)) {
      return 'Demain';
    } else if (this.isSameDay(dateObj, yesterday)) {
      return 'Hier';
    } else {
      return this.formatDate(dateObj);
    }
  }

  /**
   * Retourne le temps restant jusqu'à une date donnée
   */
  static getTimeUntil(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Passé';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) {
      return `dans ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `dans ${diffHours}h ${diffMinutes}min`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Vérifie si une date est dans le futur
   */
  static isFuture(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
  }

  /**
   * Vérifie si une date est dans le passé
   */
  static isPast(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
  }

  /**
   * Calcule la durée entre deux dates en minutes
   */
  static getDurationInMinutes(startDate: Date | string, endDate: Date | string): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Formate une durée en minutes en format lisible (ex: 2h 30min)
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes}min`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}min`;
    }
  }

  /**
   * Obtient le début de la journée pour une date donnée
   */
  static getStartOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const start = new Date(dateObj);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Obtient la fin de la journée pour une date donnée
   */
  static getEndOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const end = new Date(dateObj);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Vérifie si deux dates sont le même jour
   */
  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Retourne la prochaine occurrence d'une heure donnée
   */
  static getNextOccurrence(hour: number, minute: number = 0): Date {
    const now = new Date();
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }
}
