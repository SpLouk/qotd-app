import { Stack } from 'expo-router';
import { QueryProvider } from '@/providers/query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fff' }
          }}
        />
      </SafeAreaProvider>
    </QueryProvider>
  );
}
