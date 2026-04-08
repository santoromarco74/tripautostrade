import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../context/ReviewsContext';
import type { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P   = '#004F45'; // Verde Autostrada
const A   = '#FDC003'; // Amber
const AD  = '#785900'; // Amber dark
const BG  = '#ECF4FF'; // Background
const SF  = '#E6EFFA'; // Surface container

type LeaderboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
}

const LEVEL_LABELS: { min: number; label: string }[] = [
  { min: 5000, label: 'Leggenda' },
  { min: 3000, label: 'Campione' },
  { min: 1500, label: 'Wayfarer' },
  { min: 800,  label: 'Explorer' },
  { min: 400,  label: 'Nomad' },
  { min: 0,    label: 'Novellino' },
];

function getLevelLabel(points: number): string {
  return LEVEL_LABELS.find((l) => points >= l.min)?.label ?? 'Novellino';
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatPoints(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

const AVATAR_COLORS = [P, '#004290', '#785900', '#5B3A8A', '#B52A4A'];
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function LeaderboardScreen({ navigation }: LeaderboardScreenProps) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuth();
  const { recensioni } = useReviews();

  const [profiles, setProfiles]   = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod]       = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, points')
        .order('points', { ascending: false })
        .limit(50);
      if (error) throw error;
      setProfiles((data as Profile[]) ?? []);
    } catch {
      // silent fail — show empty state
    } finally {
      setIsLoading(false);
    }
  };

  // Stats derived from reviews context
  const userReviews     = recensioni.filter((r) => r.userId === user?.id);
  const distinctAreas   = new Set(userReviews.map((r) => r.areaId)).size;
  const userRank        = profiles.findIndex((p: Profile) => p.id === user?.id) + 1;
  const userProfile     = profiles.find((p: Profile) => p.id === user?.id);

  const top3   = profiles.slice(0, 3);
  const rest   = profiles.slice(3);

  // Podio order: [rank2, rank1, rank3]
  const podium = [top3[1], top3[0], top3[2]];

  const renderPodiumItem = (profile: Profile | undefined, rank: number) => {
    if (!profile) return <View style={{ flex: 1 }} />;
    const isFirst       = rank === 1;
    const avatarSize    = isFirst ? 100 : 72;
    const color         = avatarColor(profile.id);
    const isMe          = profile.id === user?.id;

    return (
      <View style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
        {/* Crown / trophy icon for rank 1 */}
        {isFirst && (
          <MaterialIcons name="workspace-premium" size={36} color={A} style={styles.crownIcon} />
        )}

        <View
          style={[
            styles.podiumAvatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderColor: isFirst ? A : rank === 3 ? '#FBBF24' : '#CBD5E1',
              borderWidth: isFirst ? 4 : 3,
              backgroundColor: color,
            },
          ]}
        >
          <Text style={[styles.podiumInitials, { fontSize: isFirst ? 28 : 20 }]}>
            {getInitials(profile.full_name)}
          </Text>
        </View>

        {/* Rank badge */}
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor: isFirst ? A : rank === 3 ? '#FBBF24' : '#94A3B8',
              width: isFirst ? 32 : 24,
              height: isFirst ? 32 : 24,
              borderRadius: isFirst ? 16 : 12,
            },
          ]}
        >
          <Text style={[styles.rankBadgeText, { fontSize: isFirst ? 14 : 11, color: isFirst ? AD : '#fff' }]}>
            {rank}
          </Text>
        </View>

        <Text style={[styles.podiumName, isFirst && styles.podiumNameFirst, isMe && { color: A }]} numberOfLines={1}>
          {profile.full_name ?? 'Anonimo'}
        </Text>
        <Text style={[styles.podiumPoints, isFirst && { fontSize: 13, color: AD }]}>
          {formatPoints(profile.points)} PUNTI
        </Text>
      </View>
    );
  };

  const renderListItem = ({ item, index }: { item: Profile; index: number }) => {
    const rank  = index + 4;
    const isMe  = item.id === user?.id;
    const color = avatarColor(item.id);
    const level = getLevelLabel(item.points);

    return (
      <View style={[styles.listItem, isMe && styles.listItemMe]}>
        <Text style={[styles.listRank, isMe && styles.listRankMe]}>{rank}</Text>
        <View style={[styles.listAvatar, { backgroundColor: color }]}>
          <Text style={styles.listAvatarText}>{getInitials(item.full_name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.listName, isMe && styles.listNameMe]}>
            {isMe ? `Tu (${item.full_name ?? 'Anonimo'})` : (item.full_name ?? 'Anonimo')}
          </Text>
          <Text style={[styles.listLevel, isMe && { color: 'rgba(0,79,69,0.6)' }]}>
            {level}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.listPoints, isMe && styles.listPointsMe]}>
            {item.points.toLocaleString('it-IT')}
          </Text>
          <Text style={[styles.listPointsLabel, isMe && { color: 'rgba(0,79,69,0.5)' }]}>
            PUNTI
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={P} />
        <Text style={styles.loadingText}>Caricamento classifica...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="emoji-events" size={26} color={P} />
          <Text style={styles.headerTitle}>TripAutostrade</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color="#6E7976" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* ── TOP 3 PODIO ─────────────────────────────────────────────────── */}
        {profiles.length >= 3 && (
          <View style={styles.podiumSection}>
            <View style={styles.podiumRow}>
              {podium.map((p, i) => {
                const rankOrder = i === 0 ? 2 : i === 1 ? 1 : 3;
                return (
                  <React.Fragment key={p?.id ?? i}>
                    {renderPodiumItem(p, rankOrder)}
                  </React.Fragment>
                );
              })}
            </View>
            <View style={styles.podiumBg} />
          </View>
        )}

        {/* ── LIST HEADER ─────────────────────────────────────────────────── */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Top Viaggiatori</Text>
          <View style={styles.periodContainer}>
            {(['week', 'month', 'all'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodPill, period === p && styles.periodPillActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodPillText, period === p && styles.periodPillTextActive]}>
                  {p === 'week' ? 'Settimana' : p === 'month' ? 'Mese' : 'Sempre'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── USER'S OWN RANK (if not in top 3) ────────────────────────────── */}
        {userRank > 3 && userProfile && (
          <View style={[styles.listItem, styles.listItemMe, { marginHorizontal: 16, marginBottom: 4 }]}>
            <Text style={styles.listRankMe}>{userRank}</Text>
            <View style={[styles.listAvatar, { backgroundColor: P, borderWidth: 2, borderColor: P }]}>
              <Text style={styles.listAvatarText}>{getInitials(userProfile.full_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listNameMe}>Tu ({userProfile.full_name ?? 'Anonimo'})</Text>
              <Text style={[styles.listLevel, { color: 'rgba(0,79,69,0.6)' }]}>
                {getLevelLabel(userProfile.points)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.listPointsMe}>{userProfile.points.toLocaleString('it-IT')}</Text>
              <Text style={[styles.listPointsLabel, { color: 'rgba(0,79,69,0.5)' }]}>PUNTI</Text>
            </View>
          </View>
        )}

        {/* ── LIST ITEMS (4+) ─────────────────────────────────────────────── */}
        <FlatList
          data={rest}
          keyExtractor={(item: Profile) => item.id}
          renderItem={renderListItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nessun altro viaggiatore in classifica.</Text>
          }
        />

        {/* ── STATS BENTO ─────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {/* Full-width: punti settimana */}
          <View style={styles.statsTileLarge}>
            <Text style={styles.statsTileLabel}>SETTIMANA ATTUALE</Text>
            <View style={{ marginTop: 'auto' }}>
              <Text style={styles.statsTileBig}>
                +{userProfile ? Math.min(userProfile.points, 999) : 0}
              </Text>
              <Text style={styles.statsTileDesc}>Punti guadagnati negli ultimi 7 giorni</Text>
            </View>
          </View>

          {/* Row: soste premiate + check-ins */}
          <View style={styles.statsRow}>
            <View style={[styles.statsTileSmall, { backgroundColor: A }]}>
              <MaterialIcons name="local-gas-station" size={28} color={AD} />
              <Text style={[styles.statsTileSmallLabel, { color: AD }]}>SOSTE PREMIATE</Text>
              <Text style={[styles.statsTileSmallBig, { color: AD }]}>{distinctAreas}</Text>
            </View>
            <View style={[styles.statsTileSmall, { backgroundColor: '#0059BD' }]}>
              <MaterialIcons name="share-location" size={28} color="#fff" />
              <Text style={[styles.statsTileSmallLabel, { color: '#C5D6FF' }]}>CHECK-INS</Text>
              <Text style={[styles.statsTileSmallBig, { color: '#fff' }]}>{userReviews.length}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: P,
    fontSize: 14,
  },

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: BG,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: P,
    letterSpacing: -0.5,
  },

  // ── Podium ────────────────────────────────────────────────────────────────────
  podiumSection: {
    position: 'relative',
    paddingVertical: 24,
    marginBottom: 8,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 1,
  },
  podiumBg: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,79,69,0.04)',
    borderRadius: 24,
    marginHorizontal: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  podiumFirst: {
    flex: 1.2,
    marginBottom: 24,
  },
  crownIcon: {
    marginBottom: 2,
  },
  podiumAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  podiumInitials: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    elevation: 2,
  },
  rankBadgeText: {
    fontWeight: '800',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141C25',
    textAlign: 'center',
  },
  podiumNameFirst: {
    fontSize: 16,
    fontWeight: '800',
  },
  podiumPoints: {
    fontSize: 10,
    fontWeight: '800',
    color: P,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── List header ───────────────────────────────────────────────────────────────
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P,
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#DAE3EF',
    borderRadius: 24,
    padding: 4,
    gap: 2,
  },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  periodPillActive: {
    backgroundColor: P,
  },
  periodPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6E7976',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  periodPillTextActive: {
    color: '#fff',
  },

  // ── List items ────────────────────────────────────────────────────────────────
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  listItemMe: {
    backgroundColor: 'rgba(0,79,69,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,79,69,0.12)',
  },
  listRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '800',
    color: '#6E7976',
    textAlign: 'center',
  },
  listRankMe: {
    width: 24,
    fontSize: 14,
    fontWeight: '800',
    color: P,
    textAlign: 'center',
  },
  listAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '800',
  },
  listName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141C25',
  },
  listNameMe: {
    fontSize: 14,
    fontWeight: '700',
    color: P,
  },
  listLevel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E7976',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  listPoints: {
    fontSize: 18,
    fontWeight: '900',
    color: P,
  },
  listPointsMe: {
    fontSize: 18,
    fontWeight: '900',
    color: P,
  },
  listPointsLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6E7976',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    color: '#6E7976',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },

  // ── Stats bento ───────────────────────────────────────────────────────────────
  statsGrid: {
    padding: 16,
    gap: 12,
    marginTop: 16,
  },
  statsTileLarge: {
    backgroundColor: '#00695C', // primary-container (HTML: bg-primary-container)
    borderRadius: 24,
    padding: 24,
    height: 148,
  },
  statsTileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(148,229,213,0.85)', // on-primary-container tint
    letterSpacing: 2,
  },
  statsTileBig: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  statsTileDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsTileSmall: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statsTileSmallLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsTileSmallBig: {
    fontSize: 28,
    fontWeight: '900',
  },
});
