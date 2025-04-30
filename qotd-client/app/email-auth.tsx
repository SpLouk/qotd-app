import Colors from '@/constants/Colors';
import { useSession } from '@/context/SessionContext';
import { useFetchApi, useFetchApiAndParseJson } from '@/utils/api';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmailAuth() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchAndParseJson = useFetchApiAndParseJson();
  const fetchApi = useFetchApi();
  const { setSession } = useSession();
  const router = useRouter();

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchApi('/auth_codes', {
        method: 'POST',
        body: JSON.stringify({ email_address: email.trim().toLowerCase() }),
      });
      setStep('code');
    } catch (e: any) {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchAndParseJson('/auth_codes/verify', {
        method: 'POST',
        body: JSON.stringify({ email_address: email.trim().toLowerCase(), code: code.trim() }),
      });

      const { user, ...session } = response;
      setSession(session);

      if (user.needs_registration) {
        router.replace('/sign-up');
      } else {
        router.replace('/');
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Sign In / Sign Up with Email</Text>
          {step === 'email' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                textContentType="emailAddress"
                autoComplete="email"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (!email.trim() || loading) && styles.buttonDisabled,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleSendCode}
                disabled={!email.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.instructions}>Enter the 6-digit code sent to your email.</Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                value={code}
                onChangeText={setCode}
                maxLength={6}
                editable={!loading}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (code.trim().length !== 6 || loading) && styles.buttonDisabled,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleVerify}
                disabled={code.trim().length !== 6 || loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.buttonText}>Verify Code</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
                onPress={() => setStep('email')}
              >
                <Text style={styles.linkText}>Back to email</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.text,
  },
  input: {
    width: 260,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#F7F7F7',
  },
  button: {
    width: 260,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: Colors.primary + '80',
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  error: {
    color: Colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  link: {
    marginTop: 18,
    padding: 6,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
