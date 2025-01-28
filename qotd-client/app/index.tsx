import { api } from '@/app/utils/api';
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function AppIndex() {
  // If no token, redirect to sign-in
  if (!api.getToken()) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
  },
});
