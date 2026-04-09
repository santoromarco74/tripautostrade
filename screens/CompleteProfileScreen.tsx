import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
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
const BG  = '#F7F9FF';
const SF  = '#E6EFFA';

type Props = NativeStackScreenProps<RootStackParamList, 'CompleteProfile'>;

const CUISINES = ['Camogli', 'Pizza', 'Insalate', 'Primi Piatti', 'Panini Gourmet'];
const DIETARY  = ['Senza Glutine', 'Vegano', 'Vegetariano', 'Senza Lattosio'];

interface Amenity { key: string; icon: string; label: string }
const AMENITIES: Amenity[] = [
  { key: 'pets',   icon: 'pets',       label: 'Area Cani'  },
  { key: 'shower', icon: 'shower',     label: 'Docce'      },
  { key: 'ev',     icon: 'ev-station', label: 'Ricarica EV'},
  { key: 'wifi',   icon: 'wifi',       label: 'Wi-Fi'      },
  { key: 'kids',   icon: 'child-care', label: 'Area Giochi'},
];

export default function CompleteProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(
    new Set(['Camogli', 'Insalate'])
  );
  const [dietary, setDietary] = useState<Record<string, boolean>>({
    'Senza Glutine': false, Vegano: false, Vegetariano: true, 'Senza Lattosio': false,
  });
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set(['shower']));

  const toggleCuisine = (c: string) =>
    setSelectedCuisines(prev => {
      const n = new Set(prev);
      n.has(c) ? n.delete(c) : n.add(c);
      return n;
    });

  const toggleAmenity = (k: string) =>
    setSelectedAmenities(prev => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={P} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Completamento Profilo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── PROGRESS CARD ───────────────────────────────────────────────── */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressTitle}>Quasi finito!</Text>
              <Text style={styles.progressSubtitle}>
                Completa le tue preferenze per viaggi su misura.
              </Text>
            </View>
            <Text style={styles.progressPct}>65%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressSteps}>MANCANO 3 PASSAGGI</Text>
        </View>

        {/* ── CUCINA ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cucina Preferita</Text>
          <View style={styles.chipRow}>
            {CUISINES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, selectedCuisines.has(c) && styles.chipActive]}
                onPress={() => toggleCuisine(c)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedCuisines.has(c) && styles.chipTextActive]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── RESTRIZIONI ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restrizioni Alimentari</Text>
          <View style={styles.dietCard}>
            {DIETARY.map((d, i) => (
              <View
                key={d}
                style={[styles.dietRow, i < DIETARY.length - 1 && styles.dietRowBorder]}
              >
                <Text style={styles.dietLabel}>{d}</Text>
                <Switch
                  value={dietary[d]}
                  onValueChange={v => setDietary(prev => ({ ...prev, [d]: v }))}
                  trackColor={{ false: '#DAE3EF', true: PC }}
                  thumbColor={dietary[d] ? A : '#fff'}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ── SERVIZI ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Servizi Preferiti</Text>
            <Text style={styles.sectionTag}>PERSONALIZZA</Text>
          </View>
          <View style={styles.amenityGrid}>
            {AMENITIES.map(a => {
              const active = selectedAmenities.has(a.key);
              return (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.amenityTile, active && styles.amenityTileActive]}
                  onPress={() => toggleAmenity(a.key)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={a.icon as any}
                    size={28}
                    color={active ? '#A0F2E1' : P}
                  />
                  <Text style={[styles.amenityLabel, active && styles.amenityLabelActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── SALVA ───────────────────────────────────────────────────────── */}
        <View style={styles.btnArea}>
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.88}>
            <Text style={styles.saveBtnText}>Salva Preferenze</Text>
          </TouchableOpacity>
          <Text style={styles.saveNote}>
            Puoi modificare queste impostazioni in qualsiasi momento.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ECF4FF', paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: P },

  content: { padding: 20, gap: 24, paddingBottom: 40 },

  // ── Progress ──────────────────────────────────────────────────────────────
  progressCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8,
  },
  progressTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 14,
  },
  progressTitle:    { fontSize: 22, fontWeight: '800', color: P },
  progressSubtitle: { fontSize: 13, color: '#6E7976', marginTop: 2, maxWidth: 220 },
  progressPct:      { fontSize: 24, fontWeight: '900', color: P },
  progressTrack: {
    height: 12, backgroundColor: '#DAE3EF', borderRadius: 6, overflow: 'hidden',
  },
  progressFill: {
    width: '65%', height: '100%', backgroundColor: A, borderRadius: 6,
    shadowColor: A, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  progressSteps: {
    fontSize: 10, fontWeight: '800', color: AD, letterSpacing: 1.2, marginTop: 12,
  },

  // ── Section ───────────────────────────────────────────────────────────────
  section:       { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: '#141C25' },
  sectionTag:    { fontSize: 10, fontWeight: '800', color: PC, letterSpacing: 0.8 },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: '#DAE3EF' },
  chipActive:     { backgroundColor: A },
  chipText:       { fontSize: 14, fontWeight: '600', color: '#6E7976' },
  chipTextActive: { color: AD },

  // ── Dietary ───────────────────────────────────────────────────────────────
  dietCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4,
  },
  dietRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  dietRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  dietLabel:     { fontSize: 15, fontWeight: '500', color: '#141C25' },

  // ── Amenity grid ──────────────────────────────────────────────────────────
  amenityGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityTile: {
    width: 100, height: 100, backgroundColor: '#fff', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    elevation: 1, borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  amenityTileActive:  { backgroundColor: PC, borderColor: PC },
  amenityLabel:       { fontSize: 10, fontWeight: '700', color: '#141C25', textAlign: 'center' },
  amenityLabelActive: { color: '#A0F2E1' },

  // ── Save ──────────────────────────────────────────────────────────────────
  btnArea:     { gap: 12, marginTop: 4 },
  saveBtn: {
    backgroundColor: P, borderRadius: 999, paddingVertical: 18, alignItems: 'center',
    elevation: 4, shadowColor: P, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  saveNote:    { fontSize: 13, color: '#6E7976', textAlign: 'center' },
});
