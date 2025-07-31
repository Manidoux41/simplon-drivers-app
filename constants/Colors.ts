/**
 * Palette de couleurs inspirée du logo Simplon
 *  },
  dark: {
    // Couleurs principales
    primary: '#3B82F6',
    primaryDark: '#1E40AF',
    primaryLight: '#60A5FA',
    
    // Couleurs secondaires
    secondary: '#F9FAFB',
    secondaryLight: '#F3F4F6',
    secondaryDark: '#FFFFFF',
    
    // Couleurs d'accent
    accent: '#38BDF8',
    accentDark: '#0EA5E9',
    accentLight: '#7DD3FC',sionnelles bleutées pour le transport routier
 */

export const Colors = {
  light: {
    // Couleurs principales - palette bleutée professionnelle
    primary: '#1E40AF', // Bleu Simplon principal
    primaryDark: '#1E3A8A',
    primaryLight: '#3B82F6',
    
    // Couleurs secondaires - bleu gris professionnel
    secondary: '#374151', // Gris bleuté anthracite
    secondaryLight: '#6B7280',
    secondaryDark: '#1F2937',
    
    // Couleurs d'accent - bleu ciel
    accent: '#0EA5E9', // Bleu ciel vif
    accentDark: '#0284C7',
    accentLight: '#38BDF8',
    
    // Couleurs de statut
    success: '#059669', // Vert émeraude
    warning: '#D97706', // Orange ambre
    error: '#DC2626', // Rouge vermillon
    info: '#0EA5E9', // Bleu information
    
    // Couleurs neutres
    background: '#FFFFFF',
    surface: '#F8FAFC',
    card: '#FFFFFF',
    
    // Texte
    text: '#1F2937',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    
    // Bordures et séparateurs
    border: '#E5E7EB',
    divider: '#F3F4F6',
    
    // États interactifs
    ripple: 'rgba(30, 64, 175, 0.12)',
    overlay: 'rgba(31, 41, 55, 0.5)',
    disabled: '#9CA3AF',
    
    // Couleurs spécifiques aux missions
    missionPending: '#D97706',
    missionInProgress: '#0EA5E9',
    missionCompleted: '#059669',
    missionCancelled: '#DC2626',
  },
  dark: {
    // Couleurs principales
    primary: '#E8425F',
    primaryDark: '#C41E3A',
    primaryLight: '#F1627A',
    
    // Couleurs secondaires
    secondary: '#34495E',
    secondaryLight: '#5D6D7E',
    secondaryDark: '#1C2833',
    
    // Couleurs d'accent
    accent: '#5DADE2',
    accentDark: '#3498DB',
    accentLight: '#85C1E9',
    
    // Couleurs de statut
    success: '#58D68D',
    warning: '#F7DC6F',
    error: '#EC7063',
    info: '#5DADE2',
    
    // Couleurs neutres
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2D2D2D',
    
    // Texte
    text: '#FFFFFF',
    textSecondary: '#B0BEC5',
    textLight: '#78909C',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    
    // Bordures et séparateurs
    border: '#374151',
    divider: '#424242',
    
    // États interactifs
    ripple: 'rgba(232, 66, 95, 0.12)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    disabled: '#616161',
    
    // Couleurs spécifiques aux missions
    missionPending: '#F7DC6F',
    missionInProgress: '#5DADE2',
    missionCompleted: '#58D68D',
    missionCancelled: '#EC7063',
  },
};

// Utilitaires pour obtenir les couleurs selon le thème
export const getColors = (colorScheme: 'light' | 'dark' = 'light') => {
  return Colors[colorScheme];
};

// Couleurs des statuts de mission
export const getMissionStatusColor = (status: string, colorScheme: 'light' | 'dark' = 'light') => {
  const colors = getColors(colorScheme);
  
  switch (status.toLowerCase()) {
    case 'pending':
      return colors.missionPending;
    case 'in_progress':
      return colors.missionInProgress;
    case 'completed':
      return colors.missionCompleted;
    case 'cancelled':
      return colors.missionCancelled;
    default:
      return colors.textSecondary;
  }
};
