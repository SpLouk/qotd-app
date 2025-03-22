import { api } from '@/utils/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function SignIn() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome to Hoot</Text>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={styles.button}
        onPress={async () => {
          try {
            const { identityToken } = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });

            const user = await api.post('/session', { identityToken });
            if (user.needs_registration) {
              router.replace('/sign-up');
            } else {
              router.replace('/');
            }
          } catch (e) {
            if ((e as any)?.code === 'ERR_REQUEST_CANCELED') {
              // handle that the user canceled the sign-in flow
            } else {
              console.log(e);
              // handle other errors
            }
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: Colors.primary,
  },
  button: {
    width: '100%',
    height: 44,
    maxWidth: 300,
  },
});
