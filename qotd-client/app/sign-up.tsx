import { api } from '@/utils/api';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      if (!username.trim()) {
        setError('Username is required');
        return;
      }

      await api.post('/users', { username });
      router.replace('/');
    } catch (e: any) {
      if (e.message.includes('422')) {
        setError('This username is already taken');
      } else {
        setError('Something went wrong. Please try again.');
        console.error(e);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your username</Text>
      
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 300,
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
  },
  error: {
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 300,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
