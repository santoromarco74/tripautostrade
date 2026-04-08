import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useReviews, Recensione } from '../context/ReviewsContext';
import type { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P   = '#004F45'; // Verde Autostrada
const PC  = '#00695C'; // Primary container
const A   = '#FDC003'; // Amber
const AD  = '#785900'; // Amber dark
const BG  = '#ECF4FF'; // Background
const SF  = '#E6EFFA'; // Surface container

type StatsScreenProps = NativeStackScreenProps<RootStackParamList, 'Stats'>;

const MONTHS = ['GEN','FEB','MAR','APR','MAG','GIU','LUG','AGO','SET','OTT','NOV','DIC'];

interface AreaStat {
  id: string;
  name: string;
  highway: string | null;
  count: number;
}

interface ProfileData {
  points: number;
  full_name: string | null;
}

function getLevelLabel(points: number): string {
  if (points >= 5000) return 'Leggenda';
  if (points >= 3000) return 'Campione';
  if (points >= 1500) return 'Wayfarer';
  if (points >= 800)  return 'Explorer';
  if (points >= 400)  return 'Nomad';
  return 'Novellino';
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const insets             = useSafeAreaInsets();
  const { user }           = useAuth();
  const { recensioni }     = useReviews();

  const [profile, setProfile]       = useState<ProfileData | null>(null);
  const [areaNames, setAreaNames]   = useState<Record<string, string>>({});
  const [isLoading, setIsLoading]   = useState(true);

  // ── Fetch profile + area names ────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    const load = async () => {
      setIsLoading(true);
      try {
        const [profileRes, areasRes] = await Promise.all([
          supabase.from('profiles').select('points, full_name').eq('id', user.id).single(),
          supabase.from('service_areas').select('id, name, highway'),
        ]);
        if (profileRes.data) setProfile(profileRes.data as ProfileData);
        if (areasRes.data) {
          const map: Record<string, string> = {};
          (areasRes.data as { id: number; name: string; highway: string | null }[]).forEach(
            (a) => { map[String(a.id)] = a.name; }
          );
          setAreaNames(map);
        }
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  // ── Derived stats from reviews context ────────────────────────────────────
  const userReviews = useMemo(
    () => recensioni.filter((r) => r.userId === user?.id),
    [recensioni, user]
  );

  const totalReviews  = userReviews.length;
  const avgRating     = totalReviews > 0
    ? (userReviews.reduce((s: number, r: Recensione) => s + r.stelle, 0) / totalReviews)
    : 0;
  const totalLikes    = userReviews.reduce((s: number, r: Recensione) => s + r.likeCount, 0);
  const efficiency    = Math.min(
    Math.round(((totalReviews * 10 + totalLikes * 2 + (profile?.points ?? 0) / 10) / 100) * 100),
    100
  );

  // ── Bar chart: reviews per month (last 6) ─────────────────────────────────
  const chartData = useMemo(() => {
    const now     = new Date();
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = userReviews.filter((r: Recensione) => r.data.startsWith(key)).length;
      months.push({ label: MONTHS[d.getMonth()], count });
    }
    return months;
  }, [userReviews]);

  const maxBar = Math.max(...chartData.map((m: { label: string; count: number }) => m.count), 1);

  // ── Top destinations ──────────────────────────────────────────────────────
  const topDestinations = useMemo((): AreaStat[] => {
    const counts: Record<string, number> = {};
    userReviews.forEach((r: Recensione) => {
      counts[r.areaId] = (counts[r.areaId] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({ id, name: areaNames[id] ?? `Area ${id}`, highway: null, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [userReviews, areaNames]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={P} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={22} color={P} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Travel Insights</Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="share" size={22} color={P} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* ── HERO: Wayfarer Efficiency ─────────────────────────────────── */}
        <View style={styles.heroCard}>
          {/* Decorative blob */}
          <View style={styles.heroBlob} />

          <View style={styles.heroContent}>
            {/* Left text */}
            <View style={styles.heroText}>
              <Text style={styles.heroLabel}>WAYFARER EFFICIENCY</Text>
              <Text style={styles.heroTitle}>{getLevelLabel(profile?.points ?? 0)}</Text>
              <Text style={styles.heroDesc}>
                {profile?.full_name ? `${profile.full_name}, sei` : 'Sei'} nel top{' '}
                {efficiency > 80 ? '5%' : efficiency > 60 ? '15%' : '30%'} dei viaggiatori
                attivi sulla rete autostradale.
              </Text>
            </View>

            {/* Circular progress (manual) */}
            <View style={styles.progressRing}>
              <View style={styles.progressRingOuter}>
                <View style={styles.progressRingInner}>
                  <Text style={styles.progressPercent}>{efficiency}%</Text>
                  <Text style={styles.progressLabel}>GREEN</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── MILESTONES BENTO ──────────────────────────────────────────── */}
        <View style={styles.bentoGrid}>
          {/* Reviews tile (full width) */}
          <View style={[styles.bentoTile, styles.bentoTileFull]}>
            <MaterialIcons name="rate-review" size={24} color={P} style={{ marginBottom: 12 }} />
            <Text style={styles.bentoTileLabel}>RECENSIONI TOTALI</Text>
            <Text style={styles.bentoTileBig}>
              {totalReviews}
            </Text>
          </View>

          {/* Two tiles row */}
          <View style={styles.bentoRow}>
            <View style={styles.bentoTile}>
              <MaterialIcons name="star" size={22} color={AD} style={{ marginBottom: 10 }} />
              <Text style={styles.bentoTileLabel}>MEDIA STELLE</Text>
              <Text style={styles.bentoTileBig}>
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </Text>
            </View>
            <View style={styles.bentoTile}>
              <MaterialIcons name="favorite" size={22} color="#E21937" style={{ marginBottom: 10 }} />
              <Text style={styles.bentoTileLabel}>LIKE RICEVUTI</Text>
              <Text style={styles.bentoTileBig}>{totalLikes}</Text>
            </View>
          </View>
        </View>

        {/* ── BAR CHART: Attività mensile ─────────────────────────────── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Attività nel Tempo</Text>
              <Text style={styles.chartSubtitle}>Recensioni mensili</Text>
            </View>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: A }]} />
              <View style={[styles.legendDot, { backgroundColor: SF }]} />
            </View>
          </View>

          <View style={styles.barsContainer}>
            {chartData.map((m: { label: string; count: number }, idx: number) => {
              const isHighest = m.count === Math.max(...chartData.map((x: { label: string; count: number }) => x.count)) && m.count > 0;
              const heightPct = maxBar > 0 ? m.count / maxBar : 0;
              return (
                <View key={idx} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(heightPct * 120, m.count > 0 ? 8 : 3),
                          backgroundColor: isHighest ? A : SF,
                          borderRadius: isHighest ? 6 : 4,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isHighest && { color: AD, fontWeight: '800' }]}>
                    {m.label}
                  </Text>
                  {m.count > 0 && (
                    <Text style={[styles.barCount, isHighest && { color: AD }]}>{m.count}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── TOP DESTINATIONS ────────────────────────────────────────── */}
        <View style={styles.destinationsSection}>
          <Text style={styles.destinationsTitle}>Soste Preferite</Text>

          {topDestinations.length > 0 ? (
            topDestinations.map((dest: AreaStat, idx: number) => (
              <View key={dest.id} style={styles.destinationItem}>
                <View style={[styles.destinationAvatar, { backgroundColor: idx === 0 ? P : SF }]}>
                  <Text style={[styles.destinationAvatarText, { color: idx === 0 ? '#A0F2E1' : P }]}>
                    {String(idx + 1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.destinationName}>{dest.name}</Text>
                  <Text style={styles.destinationSub}>Area di Servizio</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.destinationCount}>{dest.count}</Text>
                  <Text style={styles.destinationCountLabel}>VOLTE</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyDestinations}>
              <MaterialIcons name="place" size={36} color="#BEC9C5" />
              <Text style={styles.emptyText}>
                Scrivi le tue prime recensioni per vedere le soste preferite!
              </Text>
            </View>
          )}
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
    gap: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P,
    letterSpacing: -0.3,
  },

  content: {
    padding: 16,
    gap: 16,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: PC,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: P,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  heroBlob: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(253,192,3,0.12)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroText: {
    flex: 1,
    gap: 8,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: A,
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 19,
  },

  // ── Circular progress ────────────────────────────────────────────────────────
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 10,
    borderColor: A,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: A,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  progressRingInner: {
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: A,
    letterSpacing: 1.5,
  },

  // ── Bento grid ───────────────────────────────────────────────────────────────
  bentoGrid: {
    gap: 10,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(190,201,197,0.2)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  bentoTileFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bentoTileLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6E7976',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bentoTileBig: {
    fontSize: 28,
    fontWeight: '900',
    color: '#141C25',
    marginTop: 4,
  },

  // ── Bar chart ─────────────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(190,201,197,0.15)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#141C25',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#6E7976',
    marginTop: 3,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 144,
    gap: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    color: '#6E7976',
    marginTop: 8,
    fontWeight: '600',
  },
  barCount: {
    fontSize: 10,
    color: '#6E7976',
    marginTop: 2,
    fontWeight: '600',
  },

  // ── Top destinations ──────────────────────────────────────────────────────────
  destinationsSection: {
    gap: 10,
  },
  destinationsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#141C25',
    paddingHorizontal: 4,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(190,201,197,0.15)',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  destinationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationAvatarText: {
    fontSize: 18,
    fontWeight: '900',
  },
  destinationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141C25',
  },
  destinationSub: {
    fontSize: 11,
    color: '#6E7976',
    marginTop: 2,
  },
  destinationCount: {
    fontSize: 22,
    fontWeight: '900',
    color: P,
  },
  destinationCountLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6E7976',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyDestinations: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6E7976',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});
