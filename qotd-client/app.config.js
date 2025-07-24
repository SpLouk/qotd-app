const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Hoot (dev)' : 'Hoot',
    owner: 'hoot-of-the-day',
    slug: 'qotd',
    version: '1.2.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? 'com.loukidelis.qotd.dev' : 'com.loukidelis.qotd',
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      icon: {
        dark: './assets/images/icon.png',
        light: './assets/images/icon.png',
        tinted: './assets/images/icon.png',
      },
    },
    android: {
      package: 'com.loukidelis.qotd',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          contentFix: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      'expo-apple-authentication',
      'expo-secure-store',
      'expo-audio',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          photosPermission: 'The app accesses your photos to let you attach pictures to your posts.',
          cameraPermission: 'The app accesses your camera to let you take pictures to attach to your posts.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },

      eas: {
        projectId: '53970d8e-d45a-4ae9-a8de-d9a51b746d0a',
      },
    },
  },
};
