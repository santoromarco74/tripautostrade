import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

/**
 * Pillola globale che avvisa quando l'app sta scaricando un nuovo
 * aggiornamento OTA (expo-updates) e, a download completato, propone
 * il riavvio per applicarlo.
 *
 * Osserva in modo reattivo gli eventi di `expo-updates`: il controllo e
 * il download partono automaticamente all'avvio (`checkAutomatically: ON_LOAD`
 * in app.json). Quando il download supera `fallbackToCacheTimeout` prosegue in
 * background con l'app già avviata: è in quel momento che mostriamo la pillola.
 *
 * In Expo Go e sugli emulatori `Updates.isEnabled` è false: l'hook resta
 * inattivo e la pillola non compare mai (fallimento silenzioso, come le push).
 */
export default function UpdateBanner() {
  const { isDownloading, isUpdatePending } = Updates.useUpdates();
  const insets = useSafeAreaInsets();
  const [riavvioInCorso, setRiavvioInCorso] = useState(false);

  const riavvia = async () => {
    if (riavvioInCorso) return;
    setRiavvioInCorso(true);
    try {
      await Updates.reloadAsync();
    } catch {
      // Se il riavvio fallisce, l'aggiornamento verrà applicato alla
      // prossima apertura dell'app: sblocchiamo il pulsante.
      setRiavvioInCorso(false);
    }
  };

  // Download completato e in attesa di essere applicato: proponiamo il riavvio.
  if (isUpdatePending) {
    return (
      <Pressable
        style={[styles.banner, { bottom: insets.bottom + 92 }]}
        onPress={riavvia}
        disabled={riavvioInCorso}
      >
        {riavvioInCorso ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
        )}
        <Text style={styles.testo}>
          {riavvioInCorso ? 'Riavvio in corso…' : 'Aggiornamento pronto — Riavvia'}
        </Text>
      </Pressable>
    );
  }

  // Download in corso in background.
  if (isDownloading) {
    return (
      <View
        style={[styles.banner, { bottom: insets.bottom + 92 }]}
        pointerEvents="none"
      >
        <ActivityIndicator size="small" color="#fff" />
        <Text style={styles.testo}>Scaricamento aggiornamenti…</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
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
