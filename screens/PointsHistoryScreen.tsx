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
const SF  = '#E6EFFA';

type Props = NativeStackScreenProps<RootStackParamList, 'PointsHistory'>;

// Simulated bar heights (percentage 0–100)
const CHART_BARS = [40, 35, 50, 45, 70, 60, 85, 100, 75, 65, 50, 40];

interface HistoryItem {
  id: string; typeLabel: string; title: string; date: string;
  points: number; iconBg: string; iconColor: string; iconName: string;
  labelColor: string;
}

const HISTORY: HistoryItem[] = [
  {
    id: '1', typeLabel: 'Recensione Area di Servizio', title: 'Arda Est',
    date: '12 Maggio 2024', points: 50, iconBg: SF, iconColor: AD,
    iconName: 'star', labelColor: AD,
  },
  {
    id: '2', typeLabel: 'Sfida Completata', title: "Re dell'Autogrill",
    date: '10 Maggio 2024', points: 200, iconBg: '#FFDF9E', iconColor: '#6C5000',
    iconName: 'emoji-events', labelColor: AD,
  },
  {
    id: '3', typeLabel: 'Check-in', title: 'Secchia Ovest',
    date: '08 Maggio 2024', points: 15, iconBg: SF, iconColor: '#004290',
    iconName: 'location-on', labelColor: '#6E7976',
  },
  {
    id: '4', typeLabel: 'Recensione Area di Servizio', title: 'Brianza Nord',
    date: '05 Maggio 2024', points: 50, iconBg: SF, iconColor: AD,
    iconName: 'star', labelColor: AD,
  },
  {
    id: '5', typeLabel: 'Bonus Benvenuto', title: 'Inizio del Viaggio',
    date: '01 Maggio 2024', points: 500, iconBg: '#FFDF9E', iconColor: '#6C5000',
    iconName: 'rocket-launch', labelColor: AD,
  },
];

export default function PointsHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color="#ECF4FF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cronologia Punti</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── HERO CARD ────────────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>BILANCIO ATTUALE</Text>
              <View style={styles.heroPointsRow}>
                <Text style={styles.heroPoints}>1.250</Text>
                <Text style={styles.heroPts}>pts</Text>
              </View>
            </View>
            <View style={styles.heroIconBg}>
              <MaterialIcons name="stars" size={22} color={A} />
            </View>
          </View>

          {/* Bar chart */}
          <View style={styles.chartWrapper}>
            <Text style={styles.chartLabel}>ULTIMI 30 GIORNI</Text>
            <View style={styles.chartBars}>
              {CHART_BARS.map((h, i) => (
                <View key={i} style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${h}%` as any,
                        backgroundColor:
                          h === 100 ? A : `rgba(255,255,255,${h > 60 ? 0.3 : 0.15})`,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.chartAxisRow}>
              <Text style={styles.chartAxisText}>30 giorni fa</Text>
              <Text style={styles.chartAxisText}>Oggi</Text>
            </View>
          </View>
        </View>

        {/* ── USER BRIEF ──────────────────────────────────────────────────── */}
        <View style={styles.userBrief}>
          <View style={styles.userAvatar}>
            <MaterialIcons name="person" size={20} color="#A0F2E1" />
          </View>
          <View>
            <Text style={styles.userName}>Viaggiatore</Text>
            <Text style={styles.userLevel}>Livello: Viaggiatore Esperto</Text>
          </View>
        </View>

        {/* ── ACTIVITY LIST ────────────────────────────────────────────────── */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Attività Recenti</Text>
            <TouchableOpacity style={styles.filterBtn}>
              <Text style={styles.filterBtnText}>FILTRA</Text>
            </TouchableOpacity>
          </View>

          {HISTORY.map(item => (
            <View key={item.id} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: item.iconBg }]}>
                <MaterialIcons name={item.iconName as any} size={24} color={item.iconColor} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={[styles.historyTypeLabel, { color: item.labelColor }]}>
                  {item.typeLabel}
                </Text>
                <Text style={styles.historyTitle}>{item.title}</Text>
                <Text style={styles.historyDate}>{item.date}</Text>
              </View>
              <View style={styles.historyPoints}>
                <Text style={styles.historyPts}>+{item.points}</Text>
                <Text style={styles.historyPtsLabel}>PTS</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── PROMO CARD ───────────────────────────────────────────────────── */}
        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Vuoi più punti?</Text>
            <Text style={styles.promoText}>
              Completa la sfida "Gran Tour d'Italia" e ricevi un bonus di 1.000 pts!
            </Text>
            <TouchableOpacity style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Scopri Sfide</Text>
            </TouchableOpacity>
          </View>
          <MaterialIcons
            name="emoji-events"
            size={100}
            color="rgba(0,79,69,0.06)"
            style={styles.promoDecor}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECF4FF' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: 'rgba(0,30,25,0.92)', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#ECF4FF' },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: P, margin: 16, borderRadius: 24, padding: 24, overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
  },
  heroLabel: {
    fontSize: 10, fontWeight: '800', color: '#A0F2E1', letterSpacing: 1.5, marginBottom: 4,
  },
  heroPointsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroPoints: { fontSize: 48, fontWeight: '900', color: '#fff', lineHeight: 52 },
  heroPts: { fontSize: 22, fontWeight: '700', color: A, fontStyle: 'italic', marginBottom: 6 },
  heroIconBg: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },

  // ── Chart ─────────────────────────────────────────────────────────────────
  chartWrapper: {},
  chartLabel: {
    fontSize: 9, fontWeight: '800', color: 'rgba(160,242,225,0.7)',
    letterSpacing: 1.5, marginBottom: 12,
  },
  chartBars:  { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 3 },
  barTrack:   { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar:        { width: '100%', borderRadius: 2 },
  chartAxisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartAxisText: { fontSize: 9, color: 'rgba(160,242,225,0.5)', fontWeight: '600' },

  // ── User brief ────────────────────────────────────────────────────────────
  userBrief: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 8 },
  userAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: PC, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  userName:  { fontSize: 15, fontWeight: '700', color: '#141C25' },
  userLevel: { fontSize: 12, color: '#6E7976', marginTop: 2 },

  // ── Activity list ─────────────────────────────────────────────────────────
  activitySection: { paddingHorizontal: 16, gap: 10 },
  activityHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4, marginTop: 8,
  },
  activityTitle: { fontSize: 17, fontWeight: '700', color: P },
  filterBtn: { backgroundColor: P, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  filterBtnText: { fontSize: 10, fontWeight: '800', color: A, letterSpacing: 1 },
  historyItem: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  historyIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  historyInfo:      { flex: 1 },
  historyTypeLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 2,
  },
  historyTitle: { fontSize: 15, fontWeight: '700', color: '#141C25' },
  historyDate:  { fontSize: 12, color: '#6E7976', marginTop: 2 },
  historyPoints:    { alignItems: 'flex-end' },
  historyPts:       { fontSize: 20, fontWeight: '900', color: P },
  historyPtsLabel:  { fontSize: 9, fontWeight: '700', color: 'rgba(0,79,69,0.6)', letterSpacing: 1 },

  // ── Promo card ────────────────────────────────────────────────────────────
  promoCard: {
    backgroundColor: '#DAE3EF', margin: 16, borderRadius: 20,
    padding: 24, overflow: 'hidden', position: 'relative',
  },
  promoContent: {},
  promoTitle:   { fontSize: 17, fontWeight: '700', color: P, marginBottom: 6 },
  promoText:    { fontSize: 13, color: '#3E4946', maxWidth: '72%', lineHeight: 18 },
  promoBtn: {
    backgroundColor: P, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 8,
    alignSelf: 'flex-start', marginTop: 14,
  },
  promoBtnText: {
    fontSize: 11, fontWeight: '800', color: '#fff',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  promoDecor: { position: 'absolute', bottom: -12, right: -12 },
});
