import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useReviews, Recensione } from '../context/ReviewsContext';
import { Colors } from '../constants/Colors';

function Stelle({ numero }: { numero: number }) {
  return (
    <Text style={styles.stelle}>
      {'★'.repeat(numero)}{'☆'.repeat(5 - numero)}
    </Text>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { recensioni, deleteReview } = useReviews();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const nomeCompleto = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'Utente';
  const iniziali = nomeCompleto.slice(0, 2).toUpperCase();

  const mieRecensioni = recensioni.filter((r) => r.userId === user?.id);
  const mediaStelle =
    mieRecensioni.length > 0
      ? (mieRecensioni.reduce((acc, r) => acc + r.stelle, 0) / mieRecensioni.length).toFixed(1)
      : null;
  const totLike = mieRecensioni.reduce((acc, r) => acc + r.likeCount, 0);

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

  const gestisciElimina = (id: string) => {
    Alert.alert(
      'Elimina recensione',
      'Vuoi eliminare questa recensione? L\'operazione non è reversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(id);
            } catch {
              Alert.alert('Errore', 'Impossibile eliminare la recensione.');
            }
          },
        },
      ]
    );
  };

  const ListHeader = (
    <>
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarTesto}>{iniziali}</Text>
        </View>
        <Text style={styles.nomeHero}>{nomeCompleto}</Text>
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
          <Text style={styles.statNumero}>{mediaStelle ? `${mediaStelle} ★` : '—'}</Text>
          <Text style={styles.statLabel}>Media voti</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNumero}>{totLike}</Text>
          <Text style={styles.statLabel}>Like ricevuti</Text>
        </View>
      </View>

      {/* Sezione recensioni header */}
      <View style={styles.sezioneHeader}>
        <Text style={styles.sezioneLabel}>Le mie recensioni</Text>
      </View>
    </>
  );

  const ListFooter = (
    <View style={styles.footerSezione}>
      <Text style={styles.sezioneLabel}>Account</Text>
      <View style={styles.infoCard}>
        <Ionicons name="mail-outline" size={20} color={Colors.primary} />
        <View style={styles.infoTesti}>
          <Text style={styles.infoTitolo}>Email</Text>
          <Text style={styles.infoValore}>{user?.email ?? '—'}</Text>
        </View>
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

  return (
    <FlatList
      style={styles.container}
      data={mieRecensioni}
      keyExtractor={(item: Recensione) => item.id}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      contentContainerStyle={styles.listaContent}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
          <Text style={styles.emptyTesto}>Nessuna recensione ancora</Text>
        </View>
      }
      renderItem={({ item }: { item: Recensione }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Stelle numero={item.stelle} />
            <TouchableOpacity
              onPress={() => gestisciElimina(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color="#E53935" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardTesto}>{item.testo}</Text>
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardImmagine}
              resizeMode="cover"
            />
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.cardData}>{item.data}</Text>
            {item.likeCount > 0 && (
              <View style={styles.likeInfo}>
                <Ionicons name="heart" size={13} color="#E53935" />
                <Text style={styles.likeInfoTesto}>{item.likeCount}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listaContent: {
    paddingBottom: 40,
  },
  // ── Hero ──────────────────────────────────────────────────────────────────
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
    marginBottom: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarTesto: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  nomeHero: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  emailHero: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  // ── Stats ─────────────────────────────────────────────────────────────────
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
    marginBottom: 8,
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
  // ── Sezioni ───────────────────────────────────────────────────────────────
  sezioneHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sezioneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // ── Card recensione ───────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stelle: {
    fontSize: 16,
    color: Colors.accent,
  },
  cardTesto: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  cardImmagine: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardData: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  likeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeInfoTesto: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTesto: {
    fontSize: 14,
    color: '#aaa',
  },
  // ── Footer (Account + Logout) ─────────────────────────────────────────────
  footerSezione: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 12,
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
