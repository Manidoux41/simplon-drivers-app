import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  phoneNumber?: string;
  role: 'DRIVER' | 'ADMIN';
  isActive: boolean;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  contactPerson: string;
}

export interface Vehicle {
  id: string;
  brand: string; // Marque (Mercedes, Volvo, etc.)
  model: string; // Modèle (Sprinter, 9700, etc.)
  licensePlate: string; // Immatriculation
  fleetNumber: string; // Numéro de parc
  mileage: number; // Kilométrage
  isActive: boolean;
  // Informations carte grise
  registrationDocument: {
    vin: string; // Numéro de châssis
    firstRegistration: string; // Date de première immatriculation
    enginePower: number; // Puissance en CV
    fuelType: 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE';
    seats: number; // Nombre de places assises
    category: string; // Catégorie du véhicule (M3 pour autocar)
  };
  createdAt: string;
  updatedAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  departureLocation: string;
  departureAddress: string;
  departureLat: number;
  departureLng: number;
  scheduledDepartureAt: string;
  actualDepartureAt?: string;
  arrivalLocation: string;
  arrivalAddress: string;
  arrivalLat: number;
  arrivalLng: number;
  estimatedArrivalAt: string;
  actualArrivalAt?: string;
  routePolyline?: string;
  distance?: number;
  estimatedDuration?: number;
  maxPassengers: number;
  currentPassengers: number;
  driverId: string;
  companyId: string;
  vehicleId?: string; // ID du véhicule assigné
  
  // Suivi kilométrique
  kmDepotStart?: number; // Kilométrage départ dépôt
  kmMissionStart?: number; // Kilométrage début mission (lieu de prise en charge)
  kmMissionEnd?: number; // Kilométrage fin mission (lieu de destination)
  kmDepotEnd?: number; // Kilométrage retour dépôt
  
  // Distances calculées
  distanceDepotToDepot?: number; // Distance totale dépôt à dépôt
  distanceMissionOnly?: number; // Distance mission uniquement (prise en charge -> destination)
  
  // Suivi des temps (en minutes)
  drivingTimeMinutes?: number; // Temps de conduite saisi par le chauffeur
  restTimeMinutes?: number; // Temps de repos saisi par le chauffeur  
  waitingTimeMinutes?: number; // Temps d'attente saisi par le chauffeur
  drivingTimeComment?: string; // Commentaire optionnel sur les temps de conduite
  
  createdAt: string;
  updatedAt: string;
}

// Interface pour les temps de travail par jour
export interface DriverWorkTime {
  id: string;
  driverId: string;
  year: number;
  month: number;
  day: number;
  totalDrivingMinutes: number;
  totalRestMinutes: number;
  totalWaitingMinutes: number;
  missionCount: number;
  createdAt: string;
  updatedAt: string;
}

// Interface pour les temps de mission
export interface MissionTimeEntry {
  drivingTimeMinutes?: number;
  restTimeMinutes?: number;
  waitingTimeMinutes?: number;
  drivingTimeComment?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('simplon-drivers.db');
      console.log('📦 Base de données ouverte');
      
      await this.createTables();
      await this.migrateDatabase(); // Ajouter les migrations
      await this.debugTableStructure(); // Debug pour voir la structure
      await this.seedInitialData();
      
      console.log('✅ Base de données initialisée avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation base de données:', error);
      // En cas d'erreur, essayer de réinitialiser
      console.log('🔄 Tentative de réinitialisation de la base de données...');
      await this.resetDatabase();
      throw error;
    }
  }

  async debugUsers(): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    console.log('🔍 DEBUG: Liste des utilisateurs en base');
    const users = await this.db.getAllAsync<User>('SELECT * FROM users');
    
    for (const user of users) {
      console.log(`👤 ${user.email} - ${user.firstName} ${user.lastName} - Role: ${user.role} - Active: ${user.isActive}`);
      console.log(`   🔑 Hash: ${user.passwordHash.substring(0, 30)}...`);
      
      // Test du mot de passe par défaut pour l'admin
      if (user.email === 'superflyman90@gmail.com') {
        const testHash = await this.hashPassword('Noah0410!');
        console.log(`   🧪 Test Noah0410!: ${testHash === user.passwordHash ? '✅' : '❌'}`);
      }
      
      // Test du mot de passe par défaut pour les drivers
      if (user.role === 'DRIVER') {
        const testHash = await this.hashPassword('password123');
        console.log(`   🧪 Test password123: ${testHash === user.passwordHash ? '✅' : '❌'}`);
      }
    }
  }

  async resetDatabase() {
    try {
      if (this.db) {
        console.log('🗑️ Suppression des tables existantes...');
        await this.db.execAsync(`
          DROP TABLE IF EXISTS vehicles;
          DROP TABLE IF EXISTS missions;
          DROP TABLE IF EXISTS companies;
          DROP TABLE IF EXISTS users;
        `);
        
        console.log('🔄 Recréation des tables...');
        await this.createTables();
        await this.seedInitialData();
        
        console.log('✅ Base de données réinitialisée avec succès');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  async forceMigrations() {
    try {
      console.log('🔄 Forcer les migrations de la base de données...');
      await this.migrateDatabase();
      await this.debugTableStructure();
      console.log('✅ Migrations forcées terminées');
    } catch (error) {
      console.error('❌ Erreur lors des migrations forcées:', error);
      throw error;
    }
  }

  private async debugTableStructure() {
    if (!this.db) return;
    
    try {
      console.log('🔍 Debug: Structure des tables');
      
      // Structure de la table users
      const usersColumns = await this.db.getAllAsync<{ name: string, type: string }>(`PRAGMA table_info(users)`);
      console.log('👤 Colonnes table users:', usersColumns.map(c => `${c.name}(${c.type})`).join(', '));
      
      // Structure de la table missions
      const missionsColumns = await this.db.getAllAsync<{ name: string, type: string }>(`PRAGMA table_info(missions)`);
      console.log('📋 Colonnes table missions:', missionsColumns.map(c => `${c.name}(${c.type})`).join(', '));
      
      // Structure de la table vehicles
      const vehiclesColumns = await this.db.getAllAsync<{ name: string, type: string }>(`PRAGMA table_info(vehicles)`);
      console.log('🚗 Colonnes table vehicles:', vehiclesColumns.map(c => `${c.name}(${c.type})`).join(', '));
      
    } catch (error) {
      console.log('❌ Erreur debug structure:', error);
    }
  }

  private async migrateDatabase() {
    if (!this.db) throw new Error('Base de données non initialisée');

    try {
      // Vérifier si la colonne vehicleId existe dans la table missions
      const missionsTableInfo = await this.db.getAllAsync<{ name: string }>(`PRAGMA table_info(missions)`);
      const hasVehicleId = missionsTableInfo.some(column => column.name === 'vehicleId');
      
      if (!hasVehicleId) {
        console.log('🔄 Migration: Ajout de la colonne vehicleId à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN vehicleId TEXT`);
      }

      // Vérifier et ajouter les colonnes kilométriques
      const hasKmDepotStart = missionsTableInfo.some(column => column.name === 'kmDepotStart');
      const hasKmMissionStart = missionsTableInfo.some(column => column.name === 'kmMissionStart');
      const hasKmMissionEnd = missionsTableInfo.some(column => column.name === 'kmMissionEnd');
      const hasKmDepotEnd = missionsTableInfo.some(column => column.name === 'kmDepotEnd');
      const hasDistanceDepotToDepot = missionsTableInfo.some(column => column.name === 'distanceDepotToDepot');
      const hasDistanceMissionOnly = missionsTableInfo.some(column => column.name === 'distanceMissionOnly');

      if (!hasKmDepotStart) {
        console.log('🔄 Migration: Ajout de la colonne kmDepotStart à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN kmDepotStart REAL`);
      }

      if (!hasKmMissionStart) {
        console.log('🔄 Migration: Ajout de la colonne kmMissionStart à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN kmMissionStart REAL`);
      }

      if (!hasKmMissionEnd) {
        console.log('🔄 Migration: Ajout de la colonne kmMissionEnd à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN kmMissionEnd REAL`);
      }

      if (!hasKmDepotEnd) {
        console.log('🔄 Migration: Ajout de la colonne kmDepotEnd à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN kmDepotEnd REAL`);
      }

      if (!hasDistanceDepotToDepot) {
        console.log('🔄 Migration: Ajout de la colonne distanceDepotToDepot à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN distanceDepotToDepot REAL`);
      }

      if (!hasDistanceMissionOnly) {
        console.log('🔄 Migration: Ajout de la colonne distanceMissionOnly à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN distanceMissionOnly REAL`);
      }

      // Migrations pour les colonnes de temps de travail
      const hasDrivingTimeMinutes = missionsTableInfo.some(column => column.name === 'drivingTimeMinutes');
      const hasRestTimeMinutes = missionsTableInfo.some(column => column.name === 'restTimeMinutes');
      const hasWaitingTimeMinutes = missionsTableInfo.some(column => column.name === 'waitingTimeMinutes');
      const hasDrivingTimeComment = missionsTableInfo.some(column => column.name === 'drivingTimeComment');

      if (!hasDrivingTimeMinutes) {
        console.log('🔄 Migration: Ajout de la colonne drivingTimeMinutes à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN drivingTimeMinutes INTEGER`);
      }

      if (!hasRestTimeMinutes) {
        console.log('🔄 Migration: Ajout de la colonne restTimeMinutes à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN restTimeMinutes INTEGER`);
      }

      if (!hasWaitingTimeMinutes) {
        console.log('🔄 Migration: Ajout de la colonne waitingTimeMinutes à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN waitingTimeMinutes INTEGER`);
      }

      if (!hasDrivingTimeComment) {
        console.log('🔄 Migration: Ajout de la colonne drivingTimeComment à la table missions');
        await this.db.execAsync(`ALTER TABLE missions ADD COLUMN drivingTimeComment TEXT`);
      }

      // Migration pour ajouter le statut ASSIGNED et permettre driverId NULL
      console.log('🔄 Migration: Vérification du statut ASSIGNED et driverId nullable');
      try {
        // Tenter de créer une mission avec le statut ASSIGNED pour tester
        await this.db.runAsync(`INSERT OR IGNORE INTO missions (id, title, status, driverId, departureLocation, departureAddress, departureLat, departureLng, scheduledDepartureAt, arrivalLocation, arrivalAddress, arrivalLat, arrivalLng, estimatedArrivalAt, maxPassengers, companyId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['test-assigned-status', 'Test ASSIGNED Status', 'ASSIGNED', null, 'Test', 'Test', 0, 0, new Date().toISOString(), 'Test', 'Test', 0, 0, new Date().toISOString(), 1, 'test-company']
        );
        // Si ça marche, supprimer le test
        await this.db.runAsync(`DELETE FROM missions WHERE id = ?`, ['test-assigned-status']);
        console.log('✅ Migration: Statut ASSIGNED et driverId nullable déjà supportés');
      } catch (error) {
        console.log('🔄 Migration: Mise à jour nécessaire pour ASSIGNED et driverId nullable');
        // Si ça échoue, il faut recréer la table
        // Recréer la table missions avec la nouvelle structure
        await this.recreateMissionsTable();
      }

      // Vérifier si la table driver_work_times existe
      const workTimesTableExists = await this.db.getAllAsync<{ name: string }>(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='driver_work_times'
      `);
      
      if (workTimesTableExists.length === 0) {
        console.log('🔄 Migration: Création de la table driver_work_times');
        await this.db.execAsync(`
          CREATE TABLE driver_work_times (
            id TEXT PRIMARY KEY,
            driverId TEXT NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            day INTEGER NOT NULL,
            totalDrivingMinutes INTEGER NOT NULL DEFAULT 0,
            totalRestMinutes INTEGER NOT NULL DEFAULT 0,
            totalWaitingMinutes INTEGER NOT NULL DEFAULT 0,
            missionCount INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (driverId) REFERENCES users(id),
            UNIQUE(driverId, year, month, day)
          );
        `);
        
        // Ajouter les index pour la table driver_work_times
        await this.db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_work_times_driver ON driver_work_times(driverId);
          CREATE INDEX IF NOT EXISTS idx_work_times_period ON driver_work_times(year, month);
          CREATE INDEX IF NOT EXISTS idx_work_times_day ON driver_work_times(driverId, year, month, day);
        `);
      }

      // Vérifier les colonnes de la table users
      const usersTableInfo = await this.db.getAllAsync<{ name: string }>(`PRAGMA table_info(users)`);
      const hasFirstName = usersTableInfo.some(column => column.name === 'firstName');
      const hasLastName = usersTableInfo.some(column => column.name === 'lastName');
      
      if (!hasFirstName) {
        console.log('🔄 Migration: Ajout de la colonne firstName à la table users');
        await this.db.execAsync(`ALTER TABLE users ADD COLUMN firstName TEXT DEFAULT ''`);
      }
      
      if (!hasLastName) {
        console.log('🔄 Migration: Ajout de la colonne lastName à la table users');
        await this.db.execAsync(`ALTER TABLE users ADD COLUMN lastName TEXT DEFAULT ''`);
      }

      // Vérifier si la table vehicles existe
      const tablesResult = await this.db.getAllAsync<{ name: string }>(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='vehicles'
      `);
      
      if (tablesResult.length === 0) {
        console.log('🔄 Migration: Création de la table vehicles');
        await this.db.execAsync(`
          CREATE TABLE vehicles (
            id TEXT PRIMARY KEY,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            licensePlate TEXT NOT NULL UNIQUE,
            fleetNumber TEXT NOT NULL UNIQUE,
            mileage INTEGER NOT NULL DEFAULT 0,
            isActive INTEGER NOT NULL DEFAULT 1,
            vin TEXT NOT NULL,
            firstRegistration TEXT NOT NULL,
            enginePower INTEGER NOT NULL,
            fuelType TEXT NOT NULL CHECK (fuelType IN ('DIESEL', 'ESSENCE', 'ELECTRIQUE', 'HYBRIDE')),
            seats INTEGER NOT NULL,
            category TEXT NOT NULL,
            createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Ajouter les index pour la table vehicles
        await this.db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(licensePlate);
          CREATE INDEX IF NOT EXISTS idx_vehicles_fleet ON vehicles(fleetNumber);
          CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(isActive);
        `);
      }

      console.log('✅ Migrations terminées');
    } catch (error) {
      console.error('❌ Erreur lors des migrations:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Table des utilisateurs
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        licenseNumber TEXT UNIQUE NOT NULL,
        phoneNumber TEXT,
        role TEXT NOT NULL DEFAULT 'DRIVER' CHECK (role IN ('DRIVER', 'ADMIN')),
        isActive INTEGER NOT NULL DEFAULT 1,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table des compagnies
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        email TEXT NOT NULL,
        contactPerson TEXT NOT NULL
      );
    `);

    // Table des missions
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS missions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
        departureLocation TEXT NOT NULL,
        departureAddress TEXT NOT NULL,
        departureLat REAL NOT NULL,
        departureLng REAL NOT NULL,
        scheduledDepartureAt TEXT NOT NULL,
        actualDepartureAt TEXT,
        arrivalLocation TEXT NOT NULL,
        arrivalAddress TEXT NOT NULL,
        arrivalLat REAL NOT NULL,
        arrivalLng REAL NOT NULL,
        estimatedArrivalAt TEXT NOT NULL,
        actualArrivalAt TEXT,
        routePolyline TEXT,
        distance REAL,
        estimatedDuration INTEGER,
        maxPassengers INTEGER NOT NULL,
        currentPassengers INTEGER NOT NULL DEFAULT 0,
        driverId TEXT,
        companyId TEXT NOT NULL,
        vehicleId TEXT,
        kmDepotStart REAL,
        kmMissionStart REAL,
        kmMissionEnd REAL,
        kmDepotEnd REAL,
        distanceDepotToDepot REAL,
        distanceMissionOnly REAL,
        drivingTimeMinutes INTEGER,
        restTimeMinutes INTEGER,
        waitingTimeMinutes INTEGER,
        drivingTimeComment TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (companyId) REFERENCES companies(id),
        FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
      );
    `);

    // Table des véhicules
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        licensePlate TEXT NOT NULL UNIQUE,
        fleetNumber TEXT NOT NULL UNIQUE,
        mileage INTEGER NOT NULL DEFAULT 0,
        isActive INTEGER NOT NULL DEFAULT 1,
        vin TEXT NOT NULL,
        firstRegistration TEXT NOT NULL,
        enginePower INTEGER NOT NULL,
        fuelType TEXT NOT NULL CHECK (fuelType IN ('DIESEL', 'ESSENCE', 'ELECTRIQUE', 'HYBRIDE')),
        seats INTEGER NOT NULL,
        category TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table de suivi des temps de travail par chauffeur et mois
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS driver_work_times (
        id TEXT PRIMARY KEY,
        driverId TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        totalDrivingMinutes INTEGER NOT NULL DEFAULT 0,
        totalRestMinutes INTEGER NOT NULL DEFAULT 0,
        totalWaitingMinutes INTEGER NOT NULL DEFAULT 0,
        missionCount INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driverId) REFERENCES users(id),
        UNIQUE(driverId, year, month, day)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        missionId TEXT,
        missionTitle TEXT,
        isRead INTEGER NOT NULL DEFAULT 0,
        requiresAction INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (missionId) REFERENCES missions(id)
      );
    `);

    // Index pour les performances
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_license ON users(licenseNumber);
      CREATE INDEX IF NOT EXISTS idx_missions_driver ON missions(driverId);
      CREATE INDEX IF NOT EXISTS idx_missions_company ON missions(companyId);
      CREATE INDEX IF NOT EXISTS idx_missions_vehicle ON missions(vehicleId);
      CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
      CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(licensePlate);
      CREATE INDEX IF NOT EXISTS idx_vehicles_fleet ON vehicles(fleetNumber);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
      CREATE INDEX IF NOT EXISTS idx_notifications_mission ON notifications(missionId);
      CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(isActive);
      CREATE INDEX IF NOT EXISTS idx_work_times_driver ON driver_work_times(driverId);
      CREATE INDEX IF NOT EXISTS idx_work_times_period ON driver_work_times(year, month);
      CREATE INDEX IF NOT EXISTS idx_work_times_day ON driver_work_times(driverId, year, month, day);
    `);
  }

  private async seedInitialData() {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Vérifier si des données existent déjà
    const usersCount = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (usersCount && usersCount.count > 0) {
      console.log('📊 Données déjà présentes, skip du seeding');
      return;
    }

    console.log('🌱 Seeding des données initiales...');

    // Hash du mot de passe par défaut
    const defaultPasswordHash = await this.hashPassword('Noah0410!');

    // Insérer les compagnies
    const companies = [
      {
        id: 'comp_1',
        name: 'Mairie de Paris',
        address: '4 Place de l\'Hôtel de Ville, 75004 Paris',
        phoneNumber: '+33142767140',
        email: 'transport@paris.fr',
        contactPerson: 'Jean Dupont'
      },
      {
        id: 'comp_2',
        name: 'Conseil Général 77',
        address: '12 Rue des Saints-Pères, 77000 Melun',
        phoneNumber: '+33164141200',
        email: 'transports@seine-et-marne.fr',
        contactPerson: 'Marie Martin'
      },
      {
        id: 'comp_3',
        name: 'Lycée Technique Fontainebleau',
        address: '3 Boulevard Crevaux, 77300 Fontainebleau',
        phoneNumber: '+33164222400',
        email: 'direction@lycee-fontainebleau.fr',
        contactPerson: 'Pierre Moreau'
      },
      {
        id: 'comp_4',
        name: 'Hôpital Sud Francilien',
        address: '40 Avenue Serge Dassault, 77550 Moissy-Cramayel',
        phoneNumber: '+33160636363',
        email: 'logistique@hopital-sud.fr',
        contactPerson: 'Sophie Leroy'
      }
    ];

    for (const company of companies) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO companies (id, name, address, phoneNumber, email, contactPerson) VALUES (?, ?, ?, ?, ?, ?)',
        [company.id, company.name, company.address, company.phoneNumber, company.email, company.contactPerson]
      );
    }

    // Insérer les utilisateurs
    const users = [
      {
        id: 'admin_001',
        email: 'superflyman90@gmail.com',
        firstName: 'Noah',
        lastName: 'Admin',
        licenseNumber: 'NOAH001',
        phoneNumber: '+33123456789',
        role: 'ADMIN',
        passwordHash: defaultPasswordHash
      },
      {
        id: 'driver_001',
        email: 'jean.durand@carssimplon.fr',
        firstName: 'Jean',
        lastName: 'Durand',
        licenseNumber: 'JD123456',
        phoneNumber: '+33601234567',
        role: 'DRIVER',
        passwordHash: await this.hashPassword('password123')
      },
      {
        id: 'driver_002',
        email: 'marie.lemoine@carssimplon.fr',
        firstName: 'Marie',
        lastName: 'Lemoine',
        licenseNumber: 'ML789012',
        phoneNumber: '+33602345678',
        role: 'DRIVER',
        passwordHash: await this.hashPassword('password123')
      },
      {
        id: 'driver_003',
        email: 'pierre.bernard@carssimplon.fr',
        firstName: 'Pierre',
        lastName: 'Bernard',
        licenseNumber: 'PB345678',
        phoneNumber: '+33603456789',
        role: 'DRIVER',
        passwordHash: await this.hashPassword('password123')
      }
    ];

    for (const user of users) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO users (id, email, firstName, lastName, licenseNumber, phoneNumber, role, isActive, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.firstName, user.lastName, user.licenseNumber, user.phoneNumber, user.role, 1, user.passwordHash]
      );
    }

    // Insérer les véhicules de la flotte
    const vehicles = [
      {
        id: 'vehicle_001',
        brand: 'Mercedes-Benz',
        model: 'Sprinter 519 CDI',
        licensePlate: 'AB-123-CD',
        fleetNumber: 'CS001',
        mileage: 45230,
        isActive: true,
        vin: 'WDB9066321A123456',
        firstRegistration: '2020-03-15',
        enginePower: 190,
        fuelType: 'DIESEL',
        seats: 23,
        category: 'M3'
      },
      {
        id: 'vehicle_002',
        brand: 'Volvo',
        model: '9700 HD',
        licensePlate: 'EF-456-GH',
        fleetNumber: 'CS002',
        mileage: 67890,
        isActive: true,
        vin: 'YV3R8E50XFA234567',
        firstRegistration: '2019-07-22',
        enginePower: 420,
        fuelType: 'DIESEL',
        seats: 55,
        category: 'M3'
      },
      {
        id: 'vehicle_003',
        brand: 'Setra',
        model: 'S 415 NF',
        licensePlate: 'IJ-789-KL',
        fleetNumber: 'CS003',
        mileage: 123450,
        isActive: true,
        vin: 'WEB6320311A345678',
        firstRegistration: '2018-11-10',
        enginePower: 354,
        fuelType: 'DIESEL',
        seats: 49,
        category: 'M3'
      },
      {
        id: 'vehicle_004',
        brand: 'Iveco',
        model: 'Daily Hi-Matic',
        licensePlate: 'MN-012-OP',
        fleetNumber: 'CS004',
        mileage: 89120,
        isActive: true,
        vin: 'ZCFC70A00PA456789',
        firstRegistration: '2021-01-18',
        enginePower: 170,
        fuelType: 'DIESEL',
        seats: 19,
        category: 'M2'
      },
      {
        id: 'vehicle_005',
        brand: 'Mercedes-Benz',
        model: 'Tourismo RHD-M',
        licensePlate: 'QR-345-ST',
        fleetNumber: 'CS005',
        mileage: 201340,
        isActive: true,
        vin: 'WDB9063221A567890',
        firstRegistration: '2017-05-30',
        enginePower: 428,
        fuelType: 'DIESEL',
        seats: 59,
        category: 'M3'
      }
    ];

    for (const vehicle of vehicles) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO vehicles (id, brand, model, licensePlate, fleetNumber, mileage, isActive, vin, firstRegistration, enginePower, fuelType, seats, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          vehicle.id, vehicle.brand, vehicle.model, vehicle.licensePlate, vehicle.fleetNumber, 
          vehicle.mileage, vehicle.isActive ? 1 : 0, vehicle.vin, vehicle.firstRegistration, 
          vehicle.enginePower, vehicle.fuelType, vehicle.seats, vehicle.category
        ]
      );
    }

    // Insérer des missions de test
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const missions = [
      {
        id: 'mission_001',
        title: 'Transport Mairie de Paris - Hôtel de Ville',
        description: 'Transport de personnel administratif',
        status: 'IN_PROGRESS',
        departureLocation: 'Parking Cars Simplon',
        departureAddress: '12 Rue de la Gare, 77300 Fontainebleau',
        departureLat: 48.4084,
        departureLng: 2.7019,
        arrivalLocation: 'Hôtel de Ville de Paris',
        arrivalAddress: '4 Place de l\'Hôtel de Ville, 75004 Paris',
        arrivalLat: 48.8566,
        arrivalLng: 2.3522,
        scheduledDepartureAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        estimatedArrivalAt: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
        maxPassengers: 45,
        currentPassengers: 32,
        driverId: 'driver_001',
        companyId: 'comp_1'
      },
      {
        id: 'mission_002',
        title: 'Lycée Fontainebleau - Sortie éducative',
        description: 'Transport d\'élèves pour visite musée',
        status: 'PENDING',
        departureLocation: 'Lycée Technique Fontainebleau',
        departureAddress: '3 Boulevard Crevaux, 77300 Fontainebleau',
        departureLat: 48.4084,
        departureLng: 2.7019,
        arrivalLocation: 'Musée du Louvre',
        arrivalAddress: 'Rue de Rivoli, 75001 Paris',
        arrivalLat: 48.8606,
        arrivalLng: 2.3376,
        scheduledDepartureAt: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        estimatedArrivalAt: new Date(today.getTime() + 17 * 60 * 60 * 1000).toISOString(),
        maxPassengers: 50,
        currentPassengers: 45,
        driverId: 'driver_001',
        companyId: 'comp_3'
      },
      {
        id: 'mission_003',
        title: 'Transport médical Seine-et-Marne',
        description: 'Transport de patients non urgents',
        status: 'PENDING',
        departureLocation: 'Hôpital Sud Francilien',
        departureAddress: '40 Avenue Serge Dassault, 77550 Moissy-Cramayel',
        departureLat: 48.6289,
        departureLng: 2.6017,
        arrivalLocation: 'Hôpital Henri Mondor',
        arrivalAddress: '51 Avenue du Maréchal de Lattre de Tassigny, 94010 Créteil',
        arrivalLat: 48.7833,
        arrivalLng: 2.4667,
        scheduledDepartureAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000).toISOString(),
        estimatedArrivalAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000).toISOString(),
        maxPassengers: 20,
        currentPassengers: 12,
        driverId: 'driver_001',
        companyId: 'comp_4'
      }
    ];

    for (const mission of missions) {
      await this.db.runAsync(
        `INSERT OR IGNORE INTO missions (
          id, title, description, status, departureLocation, departureAddress, 
          departureLat, departureLng, arrivalLocation, arrivalAddress, 
          arrivalLat, arrivalLng, scheduledDepartureAt, estimatedArrivalAt,
          maxPassengers, currentPassengers, driverId, companyId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mission.id, mission.title, mission.description, mission.status,
          mission.departureLocation, mission.departureAddress,
          mission.departureLat, mission.departureLng,
          mission.arrivalLocation, mission.arrivalAddress,
          mission.arrivalLat, mission.arrivalLng,
          mission.scheduledDepartureAt, mission.estimatedArrivalAt,
          mission.maxPassengers, mission.currentPassengers,
          mission.driverId, mission.companyId
        ]
      );
    }

    console.log('✅ Seeding terminé avec succès !');
  }

  private async hashPassword(password: string): Promise<string> {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + 'cars_simplon_salt',
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hash;
  }

  // Méthodes d'authentification
  async login(email: string, password: string): Promise<User | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    console.log('🔐 Tentative de connexion pour:', email);

    const user = await this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE email = ? AND isActive = 1',
      [email]
    );

    if (!user) {
      console.log('❌ Utilisateur non trouvé ou inactif pour:', email);
      return null;
    }

    console.log('👤 Utilisateur trouvé:', user.firstName, user.lastName);
    console.log('🔑 Hash stocké:', user.passwordHash.substring(0, 20) + '...');

    const hashedInputPassword = await this.hashPassword(password);
    console.log('🔑 Hash calculé:', hashedInputPassword.substring(0, 20) + '...');

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    console.log('🔐 Mot de passe valide:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return null;
    }

    console.log('✅ Connexion réussie pour:', email);
    
    // Retourner l'utilisateur sans le hash du mot de passe
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Méthodes pour les utilisateurs
  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const user = await this.db.getFirstAsync<User>(
      'SELECT id, email, firstName, lastName, licenseNumber, phoneNumber, role, isActive, createdAt, updatedAt FROM users WHERE id = ?',
      [id]
    );

    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const users = await this.db.getAllAsync<User>(
      'SELECT id, email, firstName, lastName, licenseNumber, phoneNumber, role, isActive, createdAt, updatedAt FROM users ORDER BY firstName, lastName'
    );

    return users;
  }

  async getAdminUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const admins = await this.db.getAllAsync<User>(
      'SELECT id, email, firstName, lastName, licenseNumber, phoneNumber, role, isActive, createdAt, updatedAt FROM users WHERE role = "ADMIN" AND isActive = 1 ORDER BY firstName, lastName'
    );

    return admins;
  }

  // Méthodes pour les missions
  async getMissionsByDriverId(driverId: string): Promise<Mission[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const missions = await this.db.getAllAsync<Mission>(
      'SELECT * FROM missions WHERE driverId = ? ORDER BY scheduledDepartureAt DESC',
      [driverId]
    );

    return missions;
  }

  async getAllMissions(): Promise<Mission[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const missions = await this.db.getAllAsync<Mission>(
      'SELECT * FROM missions ORDER BY scheduledDepartureAt DESC'
    );

    return missions;
  }

  async getMissionById(id: string): Promise<Mission | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const mission = await this.db.getFirstAsync<Mission>(
      'SELECT * FROM missions WHERE id = ?',
      [id]
    );

    return mission || null;
  }

  async updateMissionStatus(id: string, status: string, actualTime?: string): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    if (status === 'IN_PROGRESS' && actualTime) {
      await this.db.runAsync(
        'UPDATE missions SET status = ?, actualDepartureAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [status, actualTime, id]
      );
    } else if (status === 'COMPLETED' && actualTime) {
      await this.db.runAsync(
        'UPDATE missions SET status = ?, actualArrivalAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [status, actualTime, id]
      );
    } else {
      await this.db.runAsync(
        'UPDATE missions SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
    }
  }

  async createMission(mission: Mission): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    await this.db.runAsync(
      `INSERT INTO missions (
        id, title, description, status, departureLocation, departureAddress, 
        departureLat, departureLng, scheduledDepartureAt, actualDepartureAt,
        arrivalLocation, arrivalAddress, arrivalLat, arrivalLng, 
        estimatedArrivalAt, actualArrivalAt, routePolyline, distance, 
        estimatedDuration, maxPassengers, currentPassengers, driverId, 
        companyId, vehicleId, kmDepotStart, kmMissionStart, kmMissionEnd, 
        kmDepotEnd, distanceDepotToDepot, distanceMissionOnly, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mission.id, 
        mission.title, 
        mission.description || null, 
        mission.status,
        mission.departureLocation, 
        mission.departureAddress, 
        mission.departureLat, 
        mission.departureLng, 
        mission.scheduledDepartureAt, 
        mission.actualDepartureAt || null,
        mission.arrivalLocation, 
        mission.arrivalAddress, 
        mission.arrivalLat, 
        mission.arrivalLng, 
        mission.estimatedArrivalAt, 
        mission.actualArrivalAt || null,
        mission.routePolyline || null, 
        mission.distance || null, 
        mission.estimatedDuration || null,
        mission.maxPassengers, 
        mission.currentPassengers, 
        mission.driverId,
        mission.companyId,
        mission.vehicleId || null,
        mission.kmDepotStart || null,
        mission.kmMissionStart || null,
        mission.kmMissionEnd || null,
        mission.kmDepotEnd || null,
        mission.distanceDepotToDepot || null,
        mission.distanceMissionOnly || null,
        mission.createdAt, 
        mission.updatedAt
      ]
    );
  }

  async updateMission(id: string, missionData: Partial<Mission>, skipNotifications: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Récupérer la mission actuelle pour comparer les changements
    const originalMission = await this.getMissionById(id);
    if (!originalMission) {
      throw new Error('Mission non trouvée');
    }

    // Construction dynamique de la requête UPDATE
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Champs pouvant être mis à jour
    const updatableFields = [
      'title', 'description', 'status', 'departureLocation', 'departureAddress',
      'departureLat', 'departureLng', 'scheduledDepartureAt', 'actualDepartureAt',
      'arrivalLocation', 'arrivalAddress', 'arrivalLat', 'arrivalLng',
      'estimatedArrivalAt', 'actualArrivalAt', 'routePolyline', 'distance',
      'estimatedDuration', 'maxPassengers', 'currentPassengers', 'vehicleId',
      'driverId', 'kmDepotStart', 'kmMissionStart', 'kmMissionEnd', 'kmDepotEnd',
      'distanceDepotToDepot', 'distanceMissionOnly'
    ];

    // Ajout des champs à mettre à jour
    updatableFields.forEach(field => {
      if (missionData.hasOwnProperty(field) && (missionData as any)[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push((missionData as any)[field]);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('Aucun champ à mettre à jour');
    }

    // Toujours mettre à jour updatedAt
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');

    // Ajout de l'ID à la fin pour la clause WHERE
    updateValues.push(id);

    const query = `UPDATE missions SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('🔍 Requête SQL:', query);
    console.log('🔍 Valeurs:', updateValues);
    
    await this.db.runAsync(query, updateValues);

    // Déclencher les notifications après la mise à jour (sauf si explicitement désactivé)
    if (!skipNotifications) {
      await this.handleMissionUpdateNotifications(originalMission, missionData);
    }

    // Notifier l'event bus que les missions ont changé
    try {
      const { missionEventBus } = await import('../services/MissionEventBus');
      missionEventBus.notify();
    } catch (error) {
      console.error('Erreur lors de la notification de l\'event bus:', error);
    }
  }

  // Gérer les notifications lors de la mise à jour d'une mission
  private async handleMissionUpdateNotifications(originalMission: Mission, updatedData: Partial<Mission>) {
    try {
      // Dynamically import to avoid circular dependency
      const { notificationService } = await import('../services/NotificationService');

      // Vérifier si le chauffeur a changé
      if (updatedData.driverId && updatedData.driverId !== originalMission.driverId) {
        console.log(`🔄 Changement de chauffeur détecté: ${originalMission.driverId} → ${updatedData.driverId}`);
        
        // Nouvelle affectation - demander confirmation au lieu d'assigner directement
        if (updatedData.driverId) {
          console.log(`📤 Envoi de demande de confirmation à: ${updatedData.driverId}`);
          
          // Mettre la mission en statut PENDING et envoyer une demande de confirmation
          await this.db!.runAsync(
            'UPDATE missions SET status = ? WHERE id = ?',
            ['PENDING', originalMission.id]
          );
          
          await notificationService.notifyMissionPendingConfirmation(updatedData.driverId, {
            ...originalMission,
            ...updatedData,
            status: 'PENDING'
          } as Mission);
        }

        // Ancienne affectation retirée
        if (originalMission.driverId) {
          await notificationService.notifyMissionRemoved(originalMission.driverId, originalMission);
        }
      } else if (updatedData.driverId && updatedData.driverId === originalMission.driverId) {
        // Mission mise à jour pour le même chauffeur - notification normale
        const changes = notificationService.detectMissionChanges(originalMission, updatedData);
        if (changes.length > 0) {
          await notificationService.notifyMissionUpdated(updatedData.driverId, {
            ...originalMission,
            ...updatedData
          } as Mission, changes);
        }
      }
    } catch (error) {
      // Ne pas faire échouer la mise à jour si les notifications échouent
      console.error('Erreur lors de l\'envoi des notifications:', error);
    }
  }

  // Méthodes pour les temps de travail
  async updateMissionTimes(missionId: string, timeData: MissionTimeEntry): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Mettre à jour les temps dans la mission
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (timeData.drivingTimeMinutes !== undefined) {
      updateFields.push('drivingTimeMinutes = ?');
      updateValues.push(timeData.drivingTimeMinutes);
    }
    if (timeData.restTimeMinutes !== undefined) {
      updateFields.push('restTimeMinutes = ?');
      updateValues.push(timeData.restTimeMinutes);
    }
    if (timeData.waitingTimeMinutes !== undefined) {
      updateFields.push('waitingTimeMinutes = ?');
      updateValues.push(timeData.waitingTimeMinutes);
    }
    if (timeData.drivingTimeComment !== undefined) {
      updateFields.push('drivingTimeComment = ?');
      updateValues.push(timeData.drivingTimeComment);
    }

    if (updateFields.length === 0) {
      return; // Rien à mettre à jour
    }

    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(missionId);

    const query = `UPDATE missions SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.db.runAsync(query, updateValues);

    // Recalculer les agrégations pour le chauffeur
    await this.updateDriverWorkTimeAggregations(missionId);
  }

  async updateDriverWorkTimeAggregations(missionId: string): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Récupérer les informations de la mission
    const mission = await this.db.getFirstAsync<Mission>(
      'SELECT driverId, scheduledDepartureAt, drivingTimeMinutes, restTimeMinutes, waitingTimeMinutes FROM missions WHERE id = ?',
      [missionId]
    );

    if (!mission) return;

    const missionDate = new Date(mission.scheduledDepartureAt);
    const year = missionDate.getFullYear();
    const month = missionDate.getMonth() + 1;
    const day = missionDate.getDate();

    // Calculer les totaux pour ce jour
    const totals = await this.db.getFirstAsync<{
      totalDriving: number;
      totalRest: number;
      totalWaiting: number;
      missionCount: number;
    }>(`
      SELECT 
        COALESCE(SUM(drivingTimeMinutes), 0) as totalDriving,
        COALESCE(SUM(restTimeMinutes), 0) as totalRest,
        COALESCE(SUM(waitingTimeMinutes), 0) as totalWaiting,
        COUNT(*) as missionCount
      FROM missions 
      WHERE driverId = ? 
        AND date(scheduledDepartureAt) = date(?)
        AND status = 'COMPLETED'
    `, [mission.driverId, mission.scheduledDepartureAt]);

    if (!totals) return;

    // Insérer ou mettre à jour l'agrégation pour ce jour
    await this.db.runAsync(`
      INSERT OR REPLACE INTO driver_work_times (
        id, driverId, year, month, day,
        totalDrivingMinutes, totalRestMinutes, totalWaitingMinutes, missionCount,
        createdAt, updatedAt
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        COALESCE((SELECT createdAt FROM driver_work_times WHERE driverId = ? AND year = ? AND month = ? AND day = ?), CURRENT_TIMESTAMP),
        CURRENT_TIMESTAMP
      )
    `, [
      `${mission.driverId}_${year}_${month}_${day}`,
      mission.driverId, year, month, day,
      totals.totalDriving, totals.totalRest, totals.totalWaiting, totals.missionCount,
      mission.driverId, year, month, day
    ]);
  }

  async getDriverWorkTimesByMonth(driverId: string, year: number, month: number): Promise<DriverWorkTime[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    return await this.db.getAllAsync<DriverWorkTime>(
      'SELECT * FROM driver_work_times WHERE driverId = ? AND year = ? AND month = ? ORDER BY day',
      [driverId, year, month]
    );
  }

  async getDriverWorkTimesTotals(driverId: string, year: number, month: number): Promise<{
    totalDrivingMinutes: number;
    totalRestMinutes: number;
    totalWaitingMinutes: number;
    totalMissions: number;
    workingDays: number;
  }> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const result = await this.db.getFirstAsync<{
      totalDrivingMinutes: number;
      totalRestMinutes: number;
      totalWaitingMinutes: number;
      totalMissions: number;
      workingDays: number;
    }>(`
      SELECT 
        COALESCE(SUM(totalDrivingMinutes), 0) as totalDrivingMinutes,
        COALESCE(SUM(totalRestMinutes), 0) as totalRestMinutes,
        COALESCE(SUM(totalWaitingMinutes), 0) as totalWaitingMinutes,
        COALESCE(SUM(missionCount), 0) as totalMissions,
        COUNT(*) as workingDays
      FROM driver_work_times 
      WHERE driverId = ? AND year = ? AND month = ?
    `, [driverId, year, month]);

    return result || {
      totalDrivingMinutes: 0,
      totalRestMinutes: 0,
      totalWaitingMinutes: 0,
      totalMissions: 0,
      workingDays: 0
    };
  }

  // Méthodes pour les notifications
  async storeNotification(notification: Omit<{
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    missionId: string;
    missionTitle: string;
    isRead: boolean;
    requiresAction?: boolean;
    createdAt: string;
  }, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    
    await this.db.runAsync(
      `INSERT INTO notifications (id, userId, type, title, message, missionId, missionTitle, isRead, requiresAction, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.missionId,
        notification.missionTitle,
        notification.isRead ? 1 : 0,
        notification.requiresAction ? 1 : 0,
        notification.createdAt
      ]
    );

    return id;
  }

  async getNotificationsForUser(userId: string): Promise<{
    id: string;
    userId: string;
    type: 'MISSION_ASSIGNED' | 'MISSION_REMOVED' | 'MISSION_UPDATED' | 'MISSION_PENDING_CONFIRMATION' | 'MISSION_REFUSED' | 'MISSION_ACCEPTED';
    title: string;
    message: string;
    missionId: string;
    missionTitle: string;
    isRead: boolean;
    requiresAction?: boolean;
    createdAt: string;
  }[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const notifications = await this.db.getAllAsync<{
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      missionId: string;
      missionTitle: string;
      isRead: number;
      requiresAction: number;
      createdAt: string;
    }>(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );

    return notifications.map(notification => ({
      ...notification,
      type: notification.type as 'MISSION_ASSIGNED' | 'MISSION_REMOVED' | 'MISSION_UPDATED' | 'MISSION_PENDING_CONFIRMATION' | 'MISSION_REFUSED' | 'MISSION_ACCEPTED',
      isRead: notification.isRead === 1,
      requiresAction: notification.requiresAction === 1
    }));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    await this.db.runAsync(
      'UPDATE notifications SET isRead = 1 WHERE id = ?',
      [notificationId]
    );
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0',
      [userId]
    );

    return result?.count || 0;
  }

  // Méthodes pour les compagnies
  async getAllCompanies(): Promise<Company[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const companies = await this.db.getAllAsync<Company>(
      'SELECT * FROM companies ORDER BY name'
    );

    return companies;
  }

  async getCompanyById(id: string): Promise<Company | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const company = await this.db.getFirstAsync<Company>(
      'SELECT * FROM companies WHERE id = ?',
      [id]
    );

    return company || null;
  }

  // Méthodes pour la gestion des utilisateurs par les admins
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phoneNumber?: string;
    role: 'DRIVER' | 'ADMIN';
    password: string;
  }): Promise<string> {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Vérifier si l'email existe déjà
    const existingUser = await this.db.getFirstAsync<{ id: string }>(
      'SELECT id FROM users WHERE email = ?',
      [userData.email]
    );

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier si le numéro de permis existe déjà
    const existingLicense = await this.db.getFirstAsync<{ id: string }>(
      'SELECT id FROM users WHERE licenseNumber = ?',
      [userData.licenseNumber]
    );

    if (existingLicense) {
      throw new Error('Un utilisateur avec ce numéro de permis existe déjà');
    }

    const id = Crypto.randomUUID();
    const passwordHash = await this.hashPassword(userData.password); // Utiliser la méthode hashPassword avec salt

    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO users (
        id, email, firstName, lastName, licenseNumber, phoneNumber, 
        role, isActive, passwordHash, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.licenseNumber,
        userData.phoneNumber || null,
        userData.role,
        1, // isActive = true
        passwordHash,
        now,
        now
      ]
    );

    return id;
  }

  async updateUserRole(userId: string, newRole: 'DRIVER' | 'ADMIN'): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const now = new Date().toISOString();

    await this.db.runAsync(
      'UPDATE users SET role = ?, updatedAt = ? WHERE id = ?',
      [newRole, now, userId]
    );
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const now = new Date().toISOString();

    await this.db.runAsync(
      'UPDATE users SET isActive = ?, updatedAt = ? WHERE id = ?',
      [isActive ? 1 : 0, now, userId]
    );
  }

  async updateUser(userId: string, userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    licenseNumber?: string;
    phoneNumber?: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const now = new Date().toISOString();
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Construire la requête dynamiquement selon les champs fournis
    if (userData.firstName !== undefined) {
      updateFields.push('firstName = ?');
      updateValues.push(userData.firstName);
    }
    if (userData.lastName !== undefined) {
      updateFields.push('lastName = ?');
      updateValues.push(userData.lastName);
    }
    if (userData.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(userData.email);
    }
    if (userData.licenseNumber !== undefined) {
      updateFields.push('licenseNumber = ?');
      updateValues.push(userData.licenseNumber);
    }
    if (userData.phoneNumber !== undefined) {
      updateFields.push('phoneNumber = ?');
      updateValues.push(userData.phoneNumber);
    }

    if (updateFields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    updateFields.push('updatedAt = ?');
    updateValues.push(now);
    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await this.db.runAsync(query, updateValues);
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Vérifier s'il y a des missions assignées à cet utilisateur
    const assignedMissions = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM missions WHERE driverId = ? AND status IN (?, ?)',
      [userId, 'PENDING', 'IN_PROGRESS']
    );

    if (assignedMissions && assignedMissions.count > 0) {
      throw new Error('Impossible de supprimer un utilisateur ayant des missions en cours ou en attente');
    }

    await this.db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
  }

  // Méthodes pour la gestion des véhicules
  async getAllVehicles(): Promise<Vehicle[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const vehicles = await this.db.getAllAsync<any>(
      'SELECT * FROM vehicles ORDER BY fleetNumber'
    );

    return vehicles.map(v => ({
      ...v,
      isActive: Boolean(v.isActive),
      registrationDocument: {
        vin: v.vin,
        firstRegistration: v.firstRegistration,
        enginePower: v.enginePower,
        fuelType: v.fuelType,
        seats: v.seats,
        category: v.category
      }
    }));
  }

  async getActiveVehicles(): Promise<Vehicle[]> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const vehicles = await this.db.getAllAsync<any>(
      'SELECT * FROM vehicles WHERE isActive = 1 ORDER BY fleetNumber'
    );

    return vehicles.map(v => ({
      ...v,
      isActive: Boolean(v.isActive),
      registrationDocument: {
        vin: v.vin,
        firstRegistration: v.firstRegistration,
        enginePower: v.enginePower,
        fuelType: v.fuelType,
        seats: v.seats,
        category: v.category
      }
    }));
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const vehicle = await this.db.getFirstAsync<any>(
      'SELECT * FROM vehicles WHERE id = ?',
      [id]
    );

    if (!vehicle) return null;

    return {
      ...vehicle,
      isActive: Boolean(vehicle.isActive),
      registrationDocument: {
        vin: vehicle.vin,
        firstRegistration: vehicle.firstRegistration,
        enginePower: vehicle.enginePower,
        fuelType: vehicle.fuelType,
        seats: vehicle.seats,
        category: vehicle.category
      }
    };
  }

  async createVehicle(vehicleData: {
    brand: string;
    model: string;
    licensePlate: string;
    fleetNumber: string;
    mileage?: number;
    registrationDocument: {
      vin: string;
      firstRegistration: string;
      enginePower: number;
      fuelType: 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE';
      seats: number;
      category: string;
    };
  }): Promise<string> {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Vérifier si l'immatriculation existe déjà
    const existingPlate = await this.db.getFirstAsync<{ id: string }>(
      'SELECT id FROM vehicles WHERE licensePlate = ?',
      [vehicleData.licensePlate]
    );

    if (existingPlate) {
      throw new Error('Un véhicule avec cette immatriculation existe déjà');
    }

    // Vérifier si le numéro de parc existe déjà
    const existingFleet = await this.db.getFirstAsync<{ id: string }>(
      'SELECT id FROM vehicles WHERE fleetNumber = ?',
      [vehicleData.fleetNumber]
    );

    if (existingFleet) {
      throw new Error('Un véhicule avec ce numéro de parc existe déjà');
    }

    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO vehicles (
        id, brand, model, licensePlate, fleetNumber, mileage, isActive,
        vin, firstRegistration, enginePower, fuelType, seats, category,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        vehicleData.brand,
        vehicleData.model,
        vehicleData.licensePlate,
        vehicleData.fleetNumber,
        vehicleData.mileage || 0,
        1, // isActive = true
        vehicleData.registrationDocument.vin,
        vehicleData.registrationDocument.firstRegistration,
        vehicleData.registrationDocument.enginePower,
        vehicleData.registrationDocument.fuelType,
        vehicleData.registrationDocument.seats,
        vehicleData.registrationDocument.category,
        now,
        now
      ]
    );

    return id;
  }

  async updateVehicleMileage(vehicleId: string, newMileage: number): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const now = new Date().toISOString();

    await this.db.runAsync(
      'UPDATE vehicles SET mileage = ?, updatedAt = ? WHERE id = ?',
      [newMileage, now, vehicleId]
    );
  }

  async updateVehicleStatus(vehicleId: string, isActive: boolean): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const now = new Date().toISOString();

    await this.db.runAsync(
      'UPDATE vehicles SET isActive = ?, updatedAt = ? WHERE id = ?',
      [isActive ? 1 : 0, now, vehicleId]
    );
  }

  async updateVehicle(vehicleId: string, vehicleData: {
    brand?: string;
    model?: string;
    licensePlate?: string;
    fleetNumber?: string;
    mileage?: number;
    registrationDocument?: {
      vin?: string;
      firstRegistration?: string;
      enginePower?: number;
      fuelType?: 'DIESEL' | 'ESSENCE' | 'ELECTRIQUE' | 'HYBRIDE';
      seats?: number;
      category?: string;
    };
  }): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    // Construire dynamiquement la requête UPDATE
    if (vehicleData.brand) {
      updates.push('brand = ?');
      values.push(vehicleData.brand);
    }
    if (vehicleData.model) {
      updates.push('model = ?');
      values.push(vehicleData.model);
    }
    if (vehicleData.licensePlate) {
      updates.push('licensePlate = ?');
      values.push(vehicleData.licensePlate.toUpperCase());
    }
    if (vehicleData.fleetNumber) {
      updates.push('fleetNumber = ?');
      values.push(vehicleData.fleetNumber.toUpperCase());
    }
    if (vehicleData.mileage !== undefined) {
      updates.push('mileage = ?');
      values.push(vehicleData.mileage);
    }

    // Gérer les champs du document d'immatriculation
    if (vehicleData.registrationDocument) {
      const reg = vehicleData.registrationDocument;
      if (reg.vin) {
        updates.push('vin = ?');
        values.push(reg.vin.toUpperCase());
      }
      if (reg.firstRegistration) {
        updates.push('firstRegistration = ?');
        values.push(reg.firstRegistration);
      }
      if (reg.enginePower !== undefined) {
        updates.push('enginePower = ?');
        values.push(reg.enginePower);
      }
      if (reg.fuelType) {
        updates.push('fuelType = ?');
        values.push(reg.fuelType);
      }
      if (reg.seats !== undefined) {
        updates.push('seats = ?');
        values.push(reg.seats);
      }
      if (reg.category) {
        updates.push('category = ?');
        values.push(reg.category);
      }
    }

    if (updates.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    // Ajouter updatedAt
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(vehicleId);

    const sql = `UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`;
    await this.db.runAsync(sql, values);
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    // Vérifier si le véhicule est utilisé dans des missions actives
    const activeMissions = await this.db.getAllAsync(
      'SELECT id FROM missions WHERE vehicleId = ? AND status IN (?, ?, ?)',
      [vehicleId, 'PENDING', 'ASSIGNED', 'IN_PROGRESS']
    );

    if (activeMissions.length > 0) {
      throw new Error('Impossible de supprimer ce véhicule : il est assigné à des missions actives');
    }

    // Supprimer le véhicule
    await this.db.runAsync('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
  }

  // Méthode de migration pour recréer la table missions avec la nouvelle structure
  private async recreateMissionsTable(): Promise<void> {
    if (!this.db) throw new Error('Base de données non initialisée');

    console.log('🔄 Migration critique: Recréation de la table missions');

    try {
      // 1. Sauvegarder les données existantes
      const existingMissions = await this.db.getAllAsync<any>('SELECT * FROM missions');
      console.log(`📋 Sauvegarde de ${existingMissions.length} missions existantes`);

      // 2. Supprimer l'ancienne table
      await this.db.execAsync('DROP TABLE IF EXISTS missions_old');
      await this.db.execAsync('ALTER TABLE missions RENAME TO missions_old');

      // 3. Créer la nouvelle table avec la structure correcte
      await this.db.execAsync(`
        CREATE TABLE missions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
          departureLocation TEXT NOT NULL,
          departureAddress TEXT NOT NULL,
          departureLat REAL NOT NULL,
          departureLng REAL NOT NULL,
          scheduledDepartureAt TEXT NOT NULL,
          actualDepartureAt TEXT,
          arrivalLocation TEXT NOT NULL,
          arrivalAddress TEXT NOT NULL,
          arrivalLat REAL NOT NULL,
          arrivalLng REAL NOT NULL,
          estimatedArrivalAt TEXT NOT NULL,
          actualArrivalAt TEXT,
          routePolyline TEXT,
          distance REAL,
          estimatedDuration INTEGER,
          maxPassengers INTEGER NOT NULL,
          currentPassengers INTEGER NOT NULL DEFAULT 0,
          driverId TEXT,
          companyId TEXT NOT NULL,
          vehicleId TEXT,
          kmDepotStart REAL,
          kmMissionStart REAL,
          kmMissionEnd REAL,
          kmDepotEnd REAL,
          distanceDepotToDepot REAL,
          distanceMissionOnly REAL,
          drivingTimeMinutes INTEGER,
          restTimeMinutes INTEGER,
          waitingTimeMinutes INTEGER,
          drivingTimeComment TEXT,
          createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (companyId) REFERENCES companies(id),
          FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
        )
      `);

      // 4. Restaurer les données avec la nouvelle structure
      for (const mission of existingMissions) {
        await this.db.runAsync(`
          INSERT INTO missions (
            id, title, description, status, departureLocation, departureAddress,
            departureLat, departureLng, scheduledDepartureAt, actualDepartureAt,
            arrivalLocation, arrivalAddress, arrivalLat, arrivalLng,
            estimatedArrivalAt, actualArrivalAt, routePolyline, distance,
            estimatedDuration, maxPassengers, currentPassengers, driverId,
            companyId, vehicleId, kmDepotStart, kmMissionStart, kmMissionEnd,
            kmDepotEnd, distanceDepotToDepot, distanceMissionOnly,
            drivingTimeMinutes, restTimeMinutes, waitingTimeMinutes,
            drivingTimeComment, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          mission.id, mission.title, mission.description, 
          mission.status === 'ASSIGNED' ? 'ASSIGNED' : mission.status, // Préserver le statut ASSIGNED
          mission.departureLocation, mission.departureAddress,
          mission.departureLat, mission.departureLng, mission.scheduledDepartureAt,
          mission.actualDepartureAt, mission.arrivalLocation, mission.arrivalAddress,
          mission.arrivalLat, mission.arrivalLng, mission.estimatedArrivalAt,
          mission.actualArrivalAt, mission.routePolyline, mission.distance,
          mission.estimatedDuration, mission.maxPassengers, mission.currentPassengers,
          mission.driverId || null, // Permettre null pour driverId
          mission.companyId, mission.vehicleId, mission.kmDepotStart,
          mission.kmMissionStart, mission.kmMissionEnd, mission.kmDepotEnd,
          mission.distanceDepotToDepot, mission.distanceMissionOnly,
          mission.drivingTimeMinutes, mission.restTimeMinutes, mission.waitingTimeMinutes,
          mission.drivingTimeComment, mission.createdAt, mission.updatedAt
        ]);
      }

      // 5. Supprimer l'ancienne table
      await this.db.execAsync('DROP TABLE missions_old');

      console.log('✅ Migration réussie: Table missions recréée avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la migration de la table missions:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();

// Fonction utilitaire pour forcer les migrations (pour débug)
export const forceDatabaseMigrations = async () => {
  await databaseService.forceMigrations();
};

// Fonction utilitaire pour réinitialiser la base de données (pour débug)
export const resetDatabase = async () => {
  await databaseService.resetDatabase();
};
