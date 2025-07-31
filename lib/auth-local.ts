import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService, User } from './database';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber?: string;
  role: 'DRIVER' | 'ADMIN';
  isActive: boolean;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  async initialize() {
    try {
      await databaseService.init();
      
      // Vérifier si un utilisateur est déjà connecté
      const savedUserId = await AsyncStorage.getItem('currentUserId');
      if (savedUserId) {
        const user = await databaseService.getUserById(savedUserId);
        if (user && user.isActive) {
          this.currentUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            licenseNumber: user.licenseNumber,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isActive: user.isActive
          };
        } else {
          // Utilisateur non trouvé ou inactif, nettoyer le storage
          await AsyncStorage.removeItem('currentUserId');
        }
      }
    } catch (error) {
      console.error('❌ Erreur initialisation auth:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const user = await databaseService.login(email, password);
      
      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      if (!user.isActive) {
        throw new Error('Compte désactivé');
      }

      this.currentUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        licenseNumber: user.licenseNumber,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive
      };

      // Sauvegarder l'ID utilisateur pour la session
      await AsyncStorage.setItem('currentUserId', user.id);

      console.log('✅ Connexion réussie:', this.currentUser.email);
      return this.currentUser;
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      this.currentUser = null;
      await AsyncStorage.removeItem('currentUserId');
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
      throw error;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMIN';
  }

  isDriver(): boolean {
    return this.currentUser?.role === 'DRIVER';
  }

  async refreshUser(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const user = await databaseService.getUserById(this.currentUser.id);
      if (user && user.isActive) {
        this.currentUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          licenseNumber: user.licenseNumber,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isActive: user.isActive
        };
      } else {
        // Utilisateur n'existe plus ou est inactif
        await this.logout();
      }
    } catch (error) {
      console.error('❌ Erreur refresh utilisateur:', error);
      await this.logout();
    }
  }
}

export const authService = new AuthService();
