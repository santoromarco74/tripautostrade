import { StyleSheet, Text, View } from 'react-native';
import { useNetworkState } from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

/**
 * Pillola globale mostrata quando il dispositivo è offline.
 * Posizionata sopra la tab bar per non coprire search bar e header.
 */
export default function OfflineBanner() {
  const networkState = useNetworkState();
  const insets = useSafeAreaInsets();

  const offline =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  if (!offline) return null;

  return (
    <View
      style={[styles.banner, { bottom: insets.bottom + 92 }]}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={15} color="#fff" />
      <Text style={styles.testo}>Sei offline — dati non aggiornati</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.warning,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 100,
  },
  testo: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
