import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface BackButtonProps {
  onPress?: () => void;
}

export default function BackButton({ onPress }: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress}>
      <Text style={styles.text}>←</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    marginRight: 8,
  },
  text: {
    fontSize: 24,
    color: Colors.primary,
  },
});
