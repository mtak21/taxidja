const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
// Android blocks plain HTTP traffic by default for apps targeting recent SDKs
// (the app itself — not the phone's browser, which explains why a browser can
// reach the dev backend over http:// while the app silently fails). Only
// needed while the API URL is http (local dev/LAN testing); a real deployment
// behind https doesn't need this.
const usesCleartextTraffic = apiUrl.startsWith('http://');

module.exports = {
  expo: {
    name: 'TaxiDja',
    slug: 'taxidja',
    scheme: 'taxidja',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.taxidja.app',
    },
    android: {
      package: 'com.taxidja.app',
      versionCode: 4,
      adaptiveIcon: {
        backgroundColor: '#D97D3D',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      '@maplibre/maplibre-react-native',
      [
        'expo-build-properties',
        {
          android: { usesCleartextTraffic },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 180,
          resizeMode: 'contain',
          backgroundColor: '#D97D3D',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            "TaxiDja a besoin de votre position pour afficher la carte et proposer des courses à proximité.",
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: "TaxiDja a besoin d'accéder à vos photos pour changer votre photo de profil.",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'ed376c4e-7034-441f-888b-3683572e8ce7',
      },
    },
  },
};
