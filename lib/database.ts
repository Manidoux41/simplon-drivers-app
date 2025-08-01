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
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
  createdAt: string;
  updatedAt: string;
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
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
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
        driverId TEXT NOT NULL,
        companyId TEXT NOT NULL,
        vehicleId TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driverId) REFERENCES users(id),
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
      CREATE INDEX IF NOT EXISTS idx_vehicles_active ON vehicles(isActive);
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
        companyId, vehicleId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        mission.createdAt, 
        mission.updatedAt
      ]
    );
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
}

export const databaseService = new DatabaseService();
