const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

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
      config: googleMapsApiKey ? { googleMapsApiKey } : undefined,
    },
    android: {
      package: 'com.taxidja.app',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      // Without a key, Google Maps still renders on Android in development
      // (with a "for development purposes only" watermark) rather than crashing.
      config: googleMapsApiKey ? { googleMaps: { apiKey: googleMapsApiKey } } : undefined,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            "TaxiDja a besoin de votre position pour afficher la carte et proposer des courses à proximité.",
        },
      ],
    ],
  },
};
