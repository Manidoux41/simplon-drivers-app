/**
 * Utilitaires pour la gestion des dates
 */

/**
 * Parse une date et une heure en objet Date valide
 */
export function parseDateTime(date: string, time: string): Date {
  if (!date || !time) {
    throw new Error('Date et heure requises');
  }

  // Vérifier le format de la date (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new Error(`Format de date invalide: ${date}. Attendu: YYYY-MM-DD`);
  }

  // Vérifier le format de l'heure (HH:MM)
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(time)) {
    throw new Error(`Format d'heure invalide: ${time}. Attendu: HH:MM`);
  }

  const dateTimeString = `${date}T${time}:00`;
  const parsedDate = new Date(dateTimeString);

  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Impossible de parser la date: ${dateTimeString}`);
  }

  // Vérifier que la date n'est pas dans le passé (optionnel)
  const now = new Date();
  if (parsedDate < now) {
    console.warn('⚠️ La date sélectionnée est dans le passé');
  }

  return parsedDate;
}

/**
 * Ajoute des minutes à une date
 */
export function addMinutes(date: Date, minutes: number): Date {
  if (isNaN(date.getTime())) {
    throw new Error('Date invalide fournie');
  }

  if (typeof minutes !== 'number' || isNaN(minutes)) {
    throw new Error('Nombre de minutes invalide');
  }

  const result = new Date(date.getTime() + minutes * 60000);
  
  if (isNaN(result.getTime())) {
    throw new Error('Erreur dans le calcul de la nouvelle date');
  }

  return result;
}

/**
 * Formate une date pour l'affichage
 */
export function formatDateTime(date: Date): string {
  if (isNaN(date.getTime())) {
    return 'Date invalide';
  }

  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Valide que la date est dans les limites acceptables
 */
export function validateDateBounds(date: Date): void {
  if (isNaN(date.getTime())) {
    throw new Error('Date invalide');
  }

  // Vérifier les limites de Date JavaScript
  const minDate = new Date('1970-01-01');
  const maxDate = new Date('2099-12-31');

  if (date < minDate || date > maxDate) {
    throw new Error(`Date hors limites: ${date.toISOString()}. Doit être entre ${minDate.toISOString()} et ${maxDate.toISOString()}`);
  }
}

/**
 * Formate une date en format ISO pour la base de données
 */
export function formatDateTimeISO(date: Date): string {
  if (isNaN(date.getTime())) {
    throw new Error('Date invalide fournie');
  }
  
  return date.toISOString();
}
