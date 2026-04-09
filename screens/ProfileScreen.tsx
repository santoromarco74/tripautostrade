import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { supabase } from '../lib/supabase';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { ReviewCard } from '../components/ReviewCard';

function calcolaTitolo(points: number): { titolo: string; emoji: string } {
  if (points >= 100) return { titolo: "Leggenda dell'Asfalto",      emoji: '🏆' };
  if (points >= 50)  return { titolo: 'Veterano delle Aree di Sosta', emoji: '🥇' };
  if (points >= 20)  return { titolo: 'Esploratore Autostradale',    emoji: '🧭' };
  return               { titolo: 'Novellino del Casello',            emoji: '🚗' };
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { recensioni, deleteReview, toggleLike } = useReviews();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [points, setPoints] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.points != null) setPoints(data.points);
        });
    }, [user?.id])
  );

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
      "Vuoi eliminare questa recensione? L'operazione non è reversibile.",
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
      {/* ── 1. HERO HEADER ── */}
      <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarTesto}>{iniziali}</Text>
        </View>
        <Text style={styles.nomeHero}>{nomeCompleto}</Text>
        <Text style={styles.emailHero}>{user?.email ?? '—'}</Text>

        {/* Badge livello — tappable → BadgeDetail */}
        <TouchableOpacity style={styles.levelBadge} onPress={() => navigation.navigate('BadgeDetail')}>
          <Text style={styles.levelEmoji}>{calcolaTitolo(points).emoji}</Text>
          <Text style={styles.levelTitolo}>{calcolaTitolo(points).titolo}</Text>
          <View style={styles.levelDot} />
          <Text style={styles.levelPunti}>{points} pt</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* Stats card fluttuante */}
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

      <Text style={styles.sezioneLabel}>Le mie recensioni</Text>
    </>
  );

  const ListFooter = (
    <View style={styles.footer}>
      {/* Info email */}
      <View style={styles.infoCard}>
        <Ionicons name="mail-outline" size={20} color={Colors.primary} />
        <View style={styles.infoTesti}>
          <Text style={styles.infoTitolo}>Email</Text>
          <Text style={styles.infoValore}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      {/* ── Navigazione rapida (riga 1) ── */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('Leaderboard')}>
          <Ionicons name="trophy-outline" size={22} color={Colors.primary} />
          <Text style={styles.quickNavLabel}>Classifica</Text>
        </TouchableOpacity>
        <View style={styles.quickNavDivider} />
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('Stats')}>
          <Ionicons name="bar-chart-outline" size={22} color={Colors.primary} />
          <Text style={styles.quickNavLabel}>Statistiche</Text>
        </TouchableOpacity>
      </View>

      {/* ── Navigazione rapida (riga 2) ── */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('PointsHistory')}>
          <Ionicons name="star-outline" size={22} color={Colors.primary} />
          <Text style={styles.quickNavLabel}>Punti</Text>
        </TouchableOpacity>
        <View style={styles.quickNavDivider} />
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('BadgeDetail')}>
          <Ionicons name="ribbon-outline" size={22} color={Colors.primary} />
          <Text style={styles.quickNavLabel}>Badge</Text>
        </TouchableOpacity>
        <View style={styles.quickNavDivider} />
        <TouchableOpacity style={styles.quickNavBtn} onPress={() => navigation.navigate('CompleteProfile')}>
          <Ionicons name="person-add-outline" size={22} color={Colors.primary} />
          <Text style={styles.quickNavLabel}>Profilo</Text>
        </TouchableOpacity>
      </View>

      {/* ── 4. LOGOUT PILL OUTLINED ── */}
      <TouchableOpacity
        style={[styles.btnLogout, isLoggingOut && { opacity: 0.6 }]}
        onPress={gestisciLogout}
        disabled={isLoggingOut}
        activeOpacity={0.75}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#E53935" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#E53935" />
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
          <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitolo}>Nessuna recensione ancora</Text>
          <Text style={styles.emptySub}>Le tue recensioni appariranno qui</Text>
        </View>
      }
      renderItem={({ item }: { item: Recensione }) => (
        <View style={styles.reviewCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.autore}</Text>
              <Text style={{ color: '#E85D04', marginVertical: 5 }}>{'⭐'.repeat(item.stelle)}</Text>
            </View>
            
            {/* Tasto Cestino per eliminare la recensione */}
            <TouchableOpacity onPress={() => gestisciElimina(item.id)} style={{ padding: 5 }}>
              <Ionicons name="trash-outline" size={22} color="#E63946" />
            </TouchableOpacity>
          </View>
          
          <Text style={{ color: '#333', marginBottom: 10 }}>{item.testo}</Text>

          {/* LA BARRA DEI MI PIACE GLOBALE */}
          <View style={{ borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 10, marginTop: 5 }}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}
              onPress={() => toggleLike(item.id)}
            >
              <Ionicons 
                name={item.likedByMe ? 'heart' : 'heart-outline'} 
                size={24} 
                color={item.likedByMe ? '#E63946' : '#999'} 
              />
              <Text style={{ 
                marginLeft: 6, 
                fontSize: 16,
                fontWeight: 'bold', 
                color: item.likedByMe ? '#E63946' : '#666' 
              }}>
                {item.likeCount > 0 ? item.likeCount : 'Mi piace'}
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 48,
  },

  // ── 1. Hero ───────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingBottom: 40,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarTesto: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  nomeHero: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  emailHero: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },

  // Stats card fluttuante
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: -24,
    borderRadius: 20,
    paddingVertical: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  sezioneLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 12,
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitolo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptySub: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 8,
    gap: 14,
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'stretch',
  },
  infoTesti: {
    flex: 1,
  },
  infoTitolo: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValore: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── 4. Logout pill outlined ───────────────────────────────────────────────
  quickNavRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  quickNavLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickNavDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '90%',
    borderRadius: 28,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#E53935',
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  btnLogoutTesto: {
    color: '#E53935',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Badge livello ─────────────────────────────────────────────────────────
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  levelEmoji: {
    fontSize: 16,
  },
  levelTitolo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  levelDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  levelPunti: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },

reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
});