import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P   = '#004F45';
const PC  = '#00695C';
const A   = '#FDC003';
const AD  = '#785900';
const BG  = '#ECF4FF';

type Props = NativeStackScreenProps<RootStackParamList, 'SuggestedStops'>;

interface Service   { icon: string; label: string }
interface StopCard  {
  id: string; name: string; rating: number; reviewCount: string;
  distance: string; distanceBadge: 'amber' | 'primary' | 'text';
  cardColor: string; services: Service[];
}

const STOPS: StopCard[] = [
  {
    id: '1', name: 'Secchia Ovest', rating: 4.8, reviewCount: '1.2k',
    distance: '15 KM',  distanceBadge: 'amber', cardColor: '#A0D4CB',
    services: [
      { icon: 'ev-station', label: 'Fast EV'       },
      { icon: 'restaurant', label: 'Gourmet Food'  },
      { icon: 'wc',         label: 'WC Puliti'     },
    ],
  },
  {
    id: '2', name: 'Arda Est', rating: 4.5, reviewCount: '850',
    distance: 'PROSSIMA USCITA', distanceBadge: 'primary', cardColor: '#88B8B0',
    services: [
      { icon: 'local-cafe',     label: 'Caffè Premium'  },
      { icon: 'park',           label: 'Area Cani'      },
      { icon: 'local-parking',  label: 'Parcheggio'     },
    ],
  },
  {
    id: '3', name: 'Cantagallo Nord', rating: 4.2, reviewCount: '',
    distance: '42 KM', distanceBadge: 'text', cardColor: '#B4D0CC',
    services: [
      { icon: 'shopping-bag', label: 'Market'     },
      { icon: 'child-care',   label: 'Kids Zone'  },
    ],
  },
];

export default function SuggestedStopsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={P} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wayfarer</Text>
        </View>
        <View style={styles.headerAvatar}>
          <MaterialIcons name="person" size={20} color={P} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TITLE ──────────────────────────────────────────────────────── */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>Soste Suggerite</Text>
          <Text style={styles.subtitle}>Personalizzate per il tuo viaggio.</Text>
        </View>

        {/* ── STOP CARDS ─────────────────────────────────────────────────── */}
        {STOPS.map(stop => (
          <View key={stop.id} style={styles.card}>
            {/* Hero image placeholder */}
            <View style={[styles.cardHero, { backgroundColor: stop.cardColor }]}>
              <MaterialIcons name="landscape" size={36} color="rgba(255,255,255,0.4)" />
              {/* Distance badge */}
              <View
                style={[
                  styles.distanceBadge,
                  stop.distanceBadge === 'primary' && styles.distanceBadgePrimary,
                  stop.distanceBadge === 'text'    && styles.distanceBadgeText,
                ]}
              >
                <Text
                  style={[
                    styles.distanceBadgeLabel,
                    stop.distanceBadge === 'primary' && { color: '#fff' },
                    stop.distanceBadge === 'text'    && { color: AD    },
                  ]}
                >
                  {stop.distance}
                </Text>
              </View>
            </View>

            {/* Card body */}
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{stop.name}</Text>
              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={14} color={AD} />
                <Text style={styles.ratingScore}>{stop.rating}</Text>
                {stop.reviewCount ? (
                  <Text style={styles.ratingCount}>({stop.reviewCount} rec.)</Text>
                ) : null}
              </View>

              {/* Service chips */}
              <View style={styles.servicesRow}>
                {stop.services.map(s => (
                  <View key={s.label} style={styles.serviceChip}>
                    <MaterialIcons name={s.icon as any} size={14} color={P} />
                    <Text style={styles.serviceChipText}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Add to route CTA */}
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.88}>
                <MaterialIcons name="add-road" size={16} color="#fff" />
                <Text style={styles.addBtnText}>Aggiungi al Percorso</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => navigation.navigate('PlanRoute')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="route" size={24} color={AD} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: BG, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle:  { fontSize: 18, fontWeight: '900', color: P },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#DAE3EF', alignItems: 'center', justifyContent: 'center',
  },

  content: { paddingHorizontal: 16, gap: 24 },

  // ── Title ─────────────────────────────────────────────────────────────────
  titleArea: { paddingTop: 8 },
  title:     { fontSize: 32, fontWeight: '800', color: P, letterSpacing: -0.5 },
  subtitle:  { fontSize: 16, color: '#6E7976', marginTop: 4 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  cardHero: {
    aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  distanceBadge: {
    position: 'absolute', top: 14, left: 14,
    backgroundColor: A, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
  },
  distanceBadgePrimary: { backgroundColor: P },
  distanceBadgeText:    { backgroundColor: 'transparent' },
  distanceBadgeLabel: {
    fontSize: 10, fontWeight: '800', color: AD,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  cardBody: { padding: 20, gap: 12 },
  cardName: { fontSize: 22, fontWeight: '800', color: P, letterSpacing: -0.3 },

  // Rating
  ratingRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingScore: { fontSize: 14, fontWeight: '700', color: AD },
  ratingCount: { fontSize: 12, color: '#6E7976', marginLeft: 2 },

  // Service chips
  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#E0E9F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  serviceChipText: {
    fontSize: 10, fontWeight: '800', color: '#3E4946',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // CTA
  addBtn: {
    backgroundColor: P, borderRadius: 999, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: A, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: A, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
});
