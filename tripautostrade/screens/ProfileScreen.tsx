import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const gestisciLogout = () => {
    Alert.alert(
      "Esci dall'account",
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await signOut();
            } catch {
              Alert.alert('Errore', 'Impossibile effettuare il logout. Riprova.');
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Ionicons name="person-circle-outline" size={72} color={Colors.primary} />

      <Text style={styles.titolo}>Il tuo profilo</Text>

      <View style={styles.emailCard}>
        <Ionicons name="mail-outline" size={20} color="#666" />
        <Text style={styles.emailTesto}>{user?.email ?? '—'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.btnLogout, isLoggingOut && { opacity: 0.7 }]}
        onPress={gestisciLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.btnLogoutTesto}>Esci dall'account</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  titolo: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignSelf: 'stretch',
  },
  emailTesto: {
    fontSize: 15,
    color: '#333',
    flexShrink: 1,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#c0392b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnLogoutTesto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
