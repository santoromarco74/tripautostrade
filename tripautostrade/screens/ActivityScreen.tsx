import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ActivityScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="list-circle-outline" size={72} color="#d0d0d0" />
      <Text style={styles.titolo}>Le tue recensioni</Text>
      <Text style={styles.sottotitolo}>Qui compariranno le recensioni che hai scritto</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  titolo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  sottotitolo: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
});
