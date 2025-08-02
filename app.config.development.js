// Configuration de développement pour Expo Go

export default ({ config }) => ({
  ...config,
  name: "Simplon Drivers (Dev)",
  slug: "simplon-drivers-app-dev",
  version: "1.0.4-dev",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "simplondriversapp-dev",
  userInterfaceStyle: "automatic",
  newArchEnabled: false, // Désactivé pour Expo Go
  description: "Application de gestion de transport pour conducteurs Simplon (Version développement)",
  keywords: [
    "transport",
    "chauffeur",
    "logistique",
    "simplon"
  ],
  privacy: "public",
  platforms: [
    "ios",
    "android"
  ],
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.superflyman90.simplondriversapp.dev",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription: "Cette application utilise votre localisation pour calculer les itinéraires et afficher votre position sur la carte.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "Cette application utilise votre localisation pour calculer les itinéraires et afficher votre position sur la carte."
    },
    buildNumber: "1"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.superflyman90.simplondriversapp.dev",
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ],
    versionCode: 1
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/images/splash-icon.png",
        dark: {
          image: "./assets/images/splash-icon.png",
          backgroundColor: "#ffffff"
        },
        imageWidth: 200
      }
    ],
    "expo-font",
    // Modules natifs désactivés pour Expo Go
    // "expo-location",
    // "expo-sqlite", 
    // ["react-native-maps", { ... }]
  ],
  experiments: {
    typedRoutes: true
  },
  runtimeVersion: "1.0.4-dev",
  updates: {
    url: "https://u.expo.dev/d02ec2c7-9741-47d7-8d85-bfb78e54ad7c"
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: "d02ec2c7-9741-47d7-8d85-bfb78e54ad7c"
    }
  }
});
