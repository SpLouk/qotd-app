import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const [foobar, setFoobar] = useState<AppleAuthentication.AppleAuthenticationCredential>();
  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={styles.button}
        onPress={async () => {
          try {
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
            });
            setFoobar(credential);
            // signed in
          } catch (e) {
            if (e.code === 'ERR_REQUEST_CANCELED') {
              // handle that the user canceled the sign-in flow
            } else {
              // handle other errors
            }
          }
        }}
      />
      <Text>
        Auth Code
        {foobar?.authorizationCode}
        Email
      </Text>
      <Text>
        {foobar?.email}
        Given name
        {foobar?.fullName?.givenName}
        token
        {foobar?.identityToken}
      </Text>
      <Text>
        state
        {foobar?.state}
      </Text>
      <Text>
        user
        {foobar?.user}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    height: 44,
  },
});
