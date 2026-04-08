import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Image, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useReviews, Recensione } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P   = '#004F45'; // Verde Autostrada
const PC  = '#00695C'; // Primary container
const A   = '#FDC003'; // Amber
const AD  = '#785900'; // Amber dark
const BG  = '#F7F9FF'; // Background
const SF  = '#E6EFFA'; // Surface container

type ActivityFeedScreenProps = NativeStackScreenProps<RootStackParamList, 'ActivityFeed'>;

type FilterKey = 'liked' | 'coffee' | 'ev';

interface AreaName {
  id: number;
  name: string;
  highway?: string | null;
}

const AVATAR_COLORS = [P, '#004290', '#785900', '#5B3A8A', '#1D6A4A'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'Ora';
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Ieri';
  if (d < 7)  return `${d}g fa`;
  return `${Math.floor(d / 7)}sett fa`;
}

export default function ActivityFeedScreen({ navigation }: ActivityFeedScreenProps) {
  const insets             = useSafeAreaInsets();
  const { user }           = useAuth();
  const { recensioni, toggleLike } = useReviews();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('liked');
  const [areaNames, setAreaNames]       = useState<Record<string, AreaName>>({});

  // Fetch area names once
  useEffect(() => {
    const fetchAreas = async () => {
      const { data } = await supabase
        .from('service_areas')
        .select('id, name, highway');
      if (data) {
        const map: Record<string, AreaName> = {};
        (data as AreaName[]).forEach((a) => { map[String(a.id)] = a; });
        setAreaNames(map);
      }
    };
    fetchAreas();
  }, []);

  const sortedFeed = useMemo(() => {
    const copy = [...recensioni];
    if (activeFilter === 'liked') {
      return copy.sort((a, b) => b.likeCount - a.likeCount || b.data.localeCompare(a.data));
    }
    return copy.sort((a, b) => b.data.localeCompare(a.data));
  }, [recensioni, activeFilter]);

  const renderCard = ({ item }: { item: Recensione }) => {
    const area    = areaNames[item.areaId];
    const color   = item.userId ? avatarColor(item.userId) : P;
    const isHigh  = item.stelle >= 4;

    return (
      <View style={styles.card}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardAuthorRow}>
            {/* Avatar */}
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: color }]}>
                <Text style={styles.avatarText}>{getInitials(item.autore)}</Text>
              </View>
            )}
            <View>
              <Text style={styles.authorName}>{item.autore}</Text>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={13} color="#6E7976" />
                <Text style={styles.locationText}>
                  {area ? `${area.name}${area.highway ? ' ' + area.highway : ''}` : `Area ${item.areaId}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating badge */}
          <View style={[styles.ratingBadge, !isHigh && styles.ratingBadgeGray]}>
            <Text style={[styles.ratingText, !isHigh && styles.ratingTextGray]}>
              {item.stelle.toFixed(1)}
            </Text>
            <MaterialIcons
              name="star"
              size={15}
              color={isHigh ? AD : '#6E7976'}
            />
          </View>
        </View>

        {/* Photo (if present) */}
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}

        {/* Review text */}
        <Text style={styles.reviewText}>"{item.testo}"</Text>

        {/* Area tag chip */}
        {area?.highway && (
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{area.highway}</Text>
            </View>
          </View>
        )}

        {/* Card footer */}
        <View style={styles.cardFooter}>
          <View style={styles.timestampPill}>
            <MaterialIcons name="schedule" size={13} color="#6E7976" />
            <Text style={styles.timestampText}>{relativeTime(item.data)}</Text>
          </View>

          {/* Like button */}
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => user && toggleLike(item.id)}
            activeOpacity={0.75}
          >
            <MaterialIcons
              name={item.likedByMe ? 'favorite' : 'favorite-border'}
              size={20}
              color={item.likedByMe ? '#E21937' : P}
            />
            <Text style={[styles.likeCount, item.likedByMe && { color: '#E21937' }]}>
              {item.likeCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="search" size={22} color="#A0F2E1" />
          <Text style={styles.headerTitle}>TripAutostrade</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={22} color="rgba(160,242,225,0.7)" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedFeed}
        keyExtractor={(item: Recensione) => item.id}
        renderItem={renderCard}
        contentContainerStyle={[styles.feedContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Feed title */}
            <View style={styles.feedTitleArea}>
              <Text style={styles.feedTitle}>Community Feed</Text>
              <Text style={styles.feedSubtitle}>Aggiornamenti in tempo reale dalla rete autostradale.</Text>
            </View>

            {/* Bento filter grid */}
            <View style={styles.filterGrid}>
              {/* Most Liked — wide tile */}
              <TouchableOpacity
                style={[styles.filterTileLarge, activeFilter === 'liked' && styles.filterTileLargeActive]}
                onPress={() => setActiveFilter('liked')}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="trending-up"
                  size={22}
                  color={activeFilter === 'liked' ? '#A0F2E1' : '#fff'}
                />
                <Text style={[styles.filterTileLargeText, activeFilter === 'liked' && { color: '#A0F2E1' }]}>
                  Più Votati
                </Text>
              </TouchableOpacity>

              {/* Coffee filter */}
              <TouchableOpacity
                style={[styles.filterTileSmall, activeFilter === 'coffee' && styles.filterTileSmallActive]}
                onPress={() => setActiveFilter(activeFilter === 'coffee' ? 'liked' : 'coffee')}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="local-cafe"
                  size={24}
                  color={activeFilter === 'coffee' ? P : P}
                />
              </TouchableOpacity>

              {/* EV filter */}
              <TouchableOpacity
                style={[styles.filterTileSmall, activeFilter === 'ev' && styles.filterTileSmallActive]}
                onPress={() => setActiveFilter(activeFilter === 'ev' ? 'liked' : 'ev')}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name="ev-station"
                  size={24}
                  color={activeFilter === 'ev' ? P : P}
                />
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="dynamic-feed" size={48} color="#BEC9C5" />
            <Text style={styles.emptyText}>Nessuna attività nel feed.</Text>
            <Text style={styles.emptySubText}>Sii il primo a recensire un'area!</Text>
          </View>
        }
      />

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      {user && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add-comment" size={28} color={AD} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: 'rgba(0,79,69,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F0FFF9',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },

  // ── Feed list content ─────────────────────────────────────────────────────────
  feedContent: {
    paddingHorizontal: 20,
    gap: 0,
  },

  // ── Feed title ────────────────────────────────────────────────────────────────
  feedTitleArea: {
    paddingTop: 24,
    marginBottom: 20,
  },
  feedTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: P,
    letterSpacing: -1,
  },
  feedSubtitle: {
    fontSize: 13,
    color: '#6E7976',
    marginTop: 4,
  },

  // ── Filter bento grid ─────────────────────────────────────────────────────────
  filterGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  filterTileLarge: {
    flex: 2,
    backgroundColor: PC,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    height: 80,
  },
  filterTileLargeActive: {
    backgroundColor: P,
  },
  filterTileLargeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  filterTileSmall: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  filterTileSmallActive: {
    backgroundColor: 'rgba(0,79,69,0.1)',
    borderWidth: 1.5,
    borderColor: P,
  },

  // ── Activity card ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(190,201,197,0.15)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141C25',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#6E7976',
    fontWeight: '500',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: A,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingBadgeGray: {
    backgroundColor: SF,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: AD,
  },
  ratingTextGray: {
    color: '#6E7976',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
  },
  reviewText: {
    fontSize: 15,
    color: '#3E4946',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  timestampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timestampText: {
    fontSize: 12,
    color: '#6E7976',
    fontWeight: '600',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 16,
    fontWeight: '800',
    color: P,
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6E7976',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // ── Service chips ────────────────────────────────────────────────────────────
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: SF,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#004290',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── FAB ──────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: A,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: A,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
});
