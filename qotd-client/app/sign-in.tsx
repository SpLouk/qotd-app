import { useHandleSignIn } from '@/app/hooks/useHandleSignIn';
import Colors from '@/constants/Colors';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignIn() {
  const handleAppleSignIn = useHandleSignIn();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../assets/images/icon.png')} style={styles.logo} contentFit="contain" />
      <Text style={styles.title}>Welcome to Hoot</Text>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={styles.button}
        onPress={handleAppleSignIn}
      />
      <Pressable
        style={({ pressed }) => [styles.emailSignInButton, pressed && { opacity: 0.7 }]}
        onPress={() => router.replace('/email-auth')}
      >
        <Text style={styles.buttonText}>Sign in with Email</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  logo: {
    width: 300,
    height: 300,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.appTitle,
  },
  button: {
    width: '100%',
    height: 44,
    maxWidth: 300,
  },
  emailSignInButton: {
    width: '100%',
    height: 44,
    maxWidth: 300,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
