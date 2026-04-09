import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P   = '#004F45';
const PC  = '#00695C';
const A   = '#FDC003';
const AD  = '#785900';
const BG  = '#F7F9FF';

type Props = NativeStackScreenProps<RootStackParamList, 'BadgeDetail'>;

interface Benefit { icon: string; iconColor: string; iconBg: string; title: string; desc: string }
const BENEFITS: Benefit[] = [
  {
    icon: 'local-cafe', iconColor: AD, iconBg: 'rgba(253,192,3,0.15)',
    title: 'Sconti esclusivi sul caffè',
    desc: 'Ricevi uno sconto del 20% su ogni espresso in autostrada.',
  },
  {
    icon: 'shower', iconColor: P, iconBg: 'rgba(0,105,92,0.15)',
    title: 'Accesso prioritario alle docce',
    desc: 'Salta la coda nelle aree Truck & Relax convenzionate.',
  },
  {
    icon: 'workspace-premium', iconColor: '#A06200', iconBg: 'rgba(253,192,3,0.2)',
    title: 'Badge dorato sul profilo',
    desc: 'Mostra a tutti i viaggiatori il tuo status regale.',
  },
];

export default function BadgeDetailScreen({ navigation }: Props) {
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
            <MaterialIcons name="arrow-back" size={22} color="#ECF4FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TripAutostrade</Text>
        </View>
        <MaterialIcons name="search" size={22} color="#ECF4FF" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* ── BADGE HERO ───────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <View style={styles.badgeContainer}>
            {/* Decorative rings */}
            <View style={styles.badgeRingOuter} />
            <View style={styles.badgeRingInner} />
            {/* Main badge circle */}
            <View style={styles.badgeMain}>
              <MaterialIcons name="local-bar" size={56} color={A} />
              <View style={styles.badgeSubIcons}>
                <MaterialIcons name="local-cafe"    size={26} color="#FFDF9E" />
                <MaterialIcons name="lunch-dining"  size={26} color="#FFDF9E" />
              </View>
            </View>
          </View>

          <Text style={styles.heroTitle}>Re dell'Autogrill</Text>
          <Text style={styles.heroDesc}>
            Conquista il trono delle soste! Per diventare il Re dell'Autogrill devi recensire 50
            diverse aree di servizio e accumulare 1.500 punti viaggio.
          </Text>
        </View>

        {/* ── PROGRESS ─────────────────────────────────────────────────────── */}
        <View style={styles.progressSection}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressLabel}>LIVELLO ATTUALE</Text>
              <Text style={styles.progressSubtitle}>3/4 del cammino</Text>
            </View>
            <View style={styles.progressRight}>
              <Text style={styles.progressCurrent}>1.250</Text>
              <Text style={styles.progressMax}>/ 1.500 PUNTI</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill}>
              <View style={styles.progressGlow} />
              <View style={styles.progressDot} />
            </View>
          </View>

          <View style={styles.progressHint}>
            <MaterialIcons name="stars" size={18} color={AD} />
            <Text style={styles.progressHintText}>Mancano solo 250 punti per il trono</Text>
          </View>
        </View>

        {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitsHeader}>
            <MaterialIcons name="verified" size={20} color={A} />
            <Text style={styles.benefitsTitle}>Vantaggi Esclusivi</Text>
          </View>

          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: b.iconBg }]}>
                <MaterialIcons name={b.icon as any} size={22} color={b.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.88}
        >
          <MaterialIcons name="add-location-alt" size={20} color="#fff" />
          <Text style={styles.ctaBtnText}>Recensisci Nuova Area</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: 'rgba(0,70,56,0.92)', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#ECF4FF', fontStyle: 'italic' },

  content: { padding: 20, gap: 24 },

  // ── Badge hero ────────────────────────────────────────────────────────────
  heroSection: { alignItems: 'center', paddingTop: 8 },
  badgeContainer: {
    width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  badgeRingOuter: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 100, backgroundColor: 'rgba(253,192,3,0.15)',
    transform: [{ rotate: '6deg' }],
  },
  badgeRingInner: {
    position: 'absolute', top: 4, left: 4, right: 4, bottom: 4,
    borderRadius: 100, backgroundColor: 'rgba(0,105,92,0.1)',
    transform: [{ rotate: '-6deg' }],
  },
  badgeMain: {
    width: 160, height: 160, borderRadius: 80, backgroundColor: P,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: A,
    elevation: 12, shadowColor: A, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 20,
  },
  badgeSubIcons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  heroTitle: {
    fontSize: 32, fontWeight: '800', color: P,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 12,
  },
  heroDesc: {
    fontSize: 15, color: '#3E4946', textAlign: 'center', lineHeight: 22, maxWidth: 300,
  },

  // ── Progress ──────────────────────────────────────────────────────────────
  progressSection: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  progressTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: 10, fontWeight: '700', color: '#6E7976',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2,
  },
  progressSubtitle: { fontSize: 20, fontWeight: '700', color: '#141C25' },
  progressRight:    { alignItems: 'flex-end' },
  progressCurrent:  { fontSize: 28, fontWeight: '900', color: AD },
  progressMax:      { fontSize: 12, color: '#6E7976', fontWeight: '600' },
  progressTrack: {
    height: 20, backgroundColor: '#DAE3EF', borderRadius: 10, overflow: 'hidden', padding: 2,
  },
  progressFill: {
    height: '100%', width: '75%', backgroundColor: P, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4,
  },
  progressGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  progressHint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressHintText: { fontSize: 13, color: P, fontWeight: '600' },

  // ── Benefits ──────────────────────────────────────────────────────────────
  benefitsSection: { gap: 10 },
  benefitsHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  benefitsTitle:   { fontSize: 18, fontWeight: '700', color: '#141C25' },
  benefitCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
    borderWidth: 1, borderColor: 'rgba(190,201,197,0.15)',
  },
  benefitIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: '#141C25', marginBottom: 4 },
  benefitDesc:  { fontSize: 13, color: '#6E7976', lineHeight: 18 },

  // ── CTA ───────────────────────────────────────────────────────────────────
  ctaBtn: {
    backgroundColor: P, borderRadius: 999, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    elevation: 6, shadowColor: P, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
