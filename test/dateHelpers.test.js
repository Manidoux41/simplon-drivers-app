/**
 * Test simple des utilitaires de date
 */
import { parseDateTime, addMinutes, validateDateBounds, formatDateTime } from '../utils/dateHelpers';

// Test de parseDateTime
console.log('=== Test parseDateTime ===');
try {
  const testDate1 = parseDateTime('2024-01-15', '14:30');
  console.log('✅ parseDateTime réussi:', testDate1);
  console.log('✅ Formaté:', formatDateTime(testDate1));
} catch (error) {
  console.error('❌ Erreur parseDateTime:', error);
}

// Test avec date invalide
console.log('\n=== Test date invalide ===');
try {
  const testDate2 = parseDateTime('2024-13-45', '25:70');
  console.log('❌ Cette ligne ne devrait pas s\'exécuter');
} catch (error) {
  console.log('✅ Erreur attendue capturée:', error.message);
}

// Test addMinutes
console.log('\n=== Test addMinutes ===');
try {
  const baseDate = parseDateTime('2024-01-15', '14:30');
  const newDate = addMinutes(baseDate, 90); // +1h30
  console.log('✅ Date de base:', formatDateTime(baseDate));
  console.log('✅ +90 minutes:', formatDateTime(newDate));
} catch (error) {
  console.error('❌ Erreur addMinutes:', error);
}

// Test validateDateBounds
console.log('\n=== Test validateDateBounds ===');
try {
  const validDate = parseDateTime('2024-06-15', '10:00');
  validateDateBounds(validDate);
  console.log('✅ Date valide dans les limites');
  
  // Date limite
  const limitDate = new Date('2100-01-01');
  validateDateBounds(limitDate);
  console.log('❌ Cette ligne ne devrait pas s\'exécuter');
} catch (error) {
  console.log('✅ Date limite rejetée:', error.message);
}

console.log('\n=== Tests terminés ===');
