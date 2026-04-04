import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../context/ReviewsContext';
import { Colors } from '../constants/Colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { recensioni } = useReviews();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const mieRecensioni = recensioni.filter((r) => r.userId === user?.id);
  const mediaStelle =
    mieRecensioni.length > 0
      ? (mieRecensioni.reduce((acc, r) => acc + r.stelle, 0) / mieRecensioni.length).toFixed(1)
      : null;

  const iniziali = user?.email?.slice(0, 2).toUpperCase() ?? '??';

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
      {/* Hero Header */}
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarTesto}>{iniziali}</Text>
        </View>
        <Text style={styles.emailHero}>{user?.email ?? '—'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>{mieRecensioni.length}</Text>
          <Text style={styles.statLabel}>Recensioni</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>
            {mediaStelle ? `${mediaStelle} ★` : '—'}
          </Text>
          <Text style={styles.statLabel}>Media voti</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>
            {mieRecensioni.reduce((acc, r) => acc + r.likeCount, 0)}
          </Text>
          <Text style={styles.statLabel}>Like ricevuti</Text>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.sezione}>
        <Text style={styles.sezioneLabel}>Account</Text>
        <View style={styles.infoCard}>
          <Ionicons name="mail-outline" size={20} color={Colors.primary} />
          <View style={styles.infoTesti}>
            <Text style={styles.infoTitolo}>Email</Text>
            <Text style={styles.infoValore}>{user?.email ?? '—'}</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.sezione}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingBottom: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarTesto: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  emailHero: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statNumero: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sezione: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sezioneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTesti: {
    flex: 1,
  },
  infoTitolo: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValore: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    marginTop: 2,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E53935',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  btnLogoutTesto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
