import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seeding...');

  // Créer les compagnies
  console.log('📊 Création des compagnies...');
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'comp_1' },
      update: {},
      create: {
        id: 'comp_1',
        name: 'Mairie de Paris',
        address: '4 Place de l\'Hôtel de Ville, 75004 Paris',
        phoneNumber: '+33142767140',
        email: 'transport@paris.fr',
        contactPerson: 'Jean Dupont',
      },
    }),
    prisma.company.upsert({
      where: { id: 'comp_2' },
      update: {},
      create: {
        id: 'comp_2',
        name: 'Conseil Général 77',
        address: '12 Rue des Saints-Pères, 77000 Melun',
        phoneNumber: '+33164141200',
        email: 'transports@seine-et-marne.fr',
        contactPerson: 'Marie Martin',
      },
    }),
    prisma.company.upsert({
      where: { id: 'comp_3' },
      update: {},
      create: {
        id: 'comp_3',
        name: 'Lycée Technique Fontainebleau',
        address: '3 Boulevard Crevaux, 77300 Fontainebleau',
        phoneNumber: '+33164222400',
        email: 'direction@lycee-fontainebleau.fr',
        contactPerson: 'Pierre Moreau',
      },
    }),
    prisma.company.upsert({
      where: { id: 'comp_4' },
      update: {},
      create: {
        id: 'comp_4',
        name: 'Hôpital Sud Francilien',
        address: '40 Avenue Serge Dassault, 77550 Moissy-Cramayel',
        phoneNumber: '+33160636363',
        email: 'logistique@hopital-sud.fr',
        contactPerson: 'Sophie Leroy',
      },
    }),
  ]);

  console.log(`✅ ${companies.length} compagnies créées`);

  // Créer les utilisateurs de test
  console.log('👥 Création des utilisateurs...');
  const users = await Promise.all([
    prisma.user.upsert({
      where: { id: 'admin_test_123' },
      update: {},
      create: {
        id: 'admin_test_123',
        email: 'admin@carssimplon.fr',
        firstName: 'Admin',
        lastName: 'Simplon',
        licenseNumber: 'ADMIN001',
        phoneNumber: '+33123456789',
        role: 'ADMIN',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { id: 'driver_test_001' },
      update: {},
      create: {
        id: 'driver_test_001',
        email: 'jean.durand@carssimplon.fr',
        firstName: 'Jean',
        lastName: 'Durand',
        licenseNumber: 'JD123456',
        phoneNumber: '+33601234567',
        role: 'DRIVER',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { id: 'driver_test_002' },
      update: {},
      create: {
        id: 'driver_test_002',
        email: 'marie.lemoine@carssimplon.fr',
        firstName: 'Marie',
        lastName: 'Lemoine',
        licenseNumber: 'ML789012',
        phoneNumber: '+33602345678',
        role: 'DRIVER',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { id: 'driver_test_003' },
      update: {},
      create: {
        id: 'driver_test_003',
        email: 'pierre.bernard@carssimplon.fr',
        firstName: 'Pierre',
        lastName: 'Bernard',
        licenseNumber: 'PB345678',
        phoneNumber: '+33603456789',
        role: 'DRIVER',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${users.length} utilisateurs créés`);

  // Créer les missions de test
  console.log('🚌 Création des missions...');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const missions = await Promise.all([
    // Mission en cours pour Jean Durand
    prisma.mission.upsert({
      where: { id: 'mission_001' },
      update: {},
      create: {
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
        scheduledDepartureAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
        estimatedArrivalAt: new Date(now.getTime() + 45 * 60 * 1000), // 45 min from now
        maxPassengers: 45,
        currentPassengers: 32,
        driverId: 'driver_test_001',
        companyId: 'comp_1',
      },
    }),

    // Mission aujourd'hui pour Jean Durand
    prisma.mission.upsert({
      where: { id: 'mission_002' },
      update: {},
      create: {
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
        scheduledDepartureAt: new Date(today.getTime() + 14 * 60 * 60 * 1000), // 14h today
        estimatedArrivalAt: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 17h today
        maxPassengers: 50,
        currentPassengers: 45,
        driverId: 'driver_test_001',
        companyId: 'comp_3',
      },
    }),

    // Mission demain pour Jean Durand
    prisma.mission.upsert({
      where: { id: 'mission_003' },
      update: {},
      create: {
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
        scheduledDepartureAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9h tomorrow
        estimatedArrivalAt: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11h tomorrow
        maxPassengers: 20,
        currentPassengers: 12,
        driverId: 'driver_test_001',
        companyId: 'comp_4',
      },
    }),

    // Mission pour Marie Lemoine
    prisma.mission.upsert({
      where: { id: 'mission_005' },
      update: {},
      create: {
        id: 'mission_005',
        title: 'Transport scolaire - Retour',
        description: 'Retour d\'élèves après sortie',
        status: 'PENDING',
        departureLocation: 'Musée d\'Orsay',
        departureAddress: '1 Rue de la Légion d\'Honneur, 75007 Paris',
        departureLat: 48.8600,
        departureLng: 2.3266,
        arrivalLocation: 'Lycée Technique Fontainebleau',
        arrivalAddress: '3 Boulevard Crevaux, 77300 Fontainebleau',
        arrivalLat: 48.4084,
        arrivalLng: 2.7019,
        scheduledDepartureAt: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 16h today
        estimatedArrivalAt: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 18h today
        maxPassengers: 50,
        currentPassengers: 48,
        driverId: 'driver_test_002',
        companyId: 'comp_3',
      },
    }),

    // Mission complétée pour Pierre Bernard
    prisma.mission.upsert({
      where: { id: 'mission_006' },
      update: {},
      create: {
        id: 'mission_006',
        title: 'Transport administratif - Mission terminée',
        description: 'Transport de personnel - Mission d\'hier',
        status: 'COMPLETED',
        departureLocation: 'Mairie de Fontainebleau',
        departureAddress: '40 Rue Royale, 77300 Fontainebleau',
        departureLat: 48.4084,
        departureLng: 2.7019,
        arrivalLocation: 'Préfecture de Seine-et-Marne',
        arrivalAddress: '12 Rue des Saints-Pères, 77000 Melun',
        arrivalLat: 48.5333,
        arrivalLng: 2.6667,
        scheduledDepartureAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 9h yesterday
        estimatedArrivalAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 11h yesterday
        actualDepartureAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 5 * 60 * 1000), // 9h05 yesterday
        actualArrivalAt: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 10 * 60 * 1000), // 11h10 yesterday
        maxPassengers: 25,
        currentPassengers: 20,
        driverId: 'driver_test_003',
        companyId: 'comp_2',
      },
    }),
  ]);

  console.log(`✅ ${missions.length} missions créées`);

  console.log('🎉 Seeding terminé avec succès !');
  console.log('\n📊 Résumé :');
  console.log(`- ${companies.length} compagnies`);
  console.log(`- ${users.length} utilisateurs (1 admin + 3 conducteurs)`);
  console.log(`- ${missions.length} missions`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur durant le seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
