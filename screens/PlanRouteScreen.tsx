import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
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

type Props = NativeStackScreenProps<RootStackParamList, 'PlanRoute'>;

interface Waypoint { id: string; name: string; sub: string; dot: string }

const INITIAL_WAYPOINTS: Waypoint[] = [
  { id: '1', name: 'Milano Centrale', sub: 'PUNTO DI PARTENZA',       dot: P    },
  { id: '2', name: 'Secchia Ovest S.A.', sub: 'COFFEE & FUEL • 165KM', dot: A    },
  { id: '3', name: 'Roma Nord',       sub: 'DESTINAZIONE',             dot: '#004290' },
];

export default function PlanRouteScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tripName,   setTripName]   = useState('Milano - Roma Estate');
  const [waypoints,  setWaypoints]  = useState<Waypoint[]>(INITIAL_WAYPOINTS);

  const removeWaypoint = (id: string) =>
    setWaypoints(prev => prev.filter(w => w.id !== id));

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
          <Text style={styles.headerTitle}>TripAutostrade</Text>
        </View>
        <View style={styles.headerAvatar}>
          <MaterialIcons name="person" size={20} color={P} />
        </View>
      </View>

      {/* ── MAP PLACEHOLDER ─────────────────────────────────────────────── */}
      <View style={styles.mapArea}>
        {/* Simulated topographic background */}
        <View style={styles.mapBg} />
        {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
          <View
            key={i}
            style={[styles.mapLine, { top: `${y * 100}%` as any }]}
          />
        ))}

        {/* Simulated map pins */}
        <View style={[styles.mapPin, { top: '40%', left: '25%' as any }]}>
          <View style={styles.mapPinBubble}>
            <MaterialIcons name="local-gas-station" size={11} color="#fff" />
            <Text style={styles.mapPinText}>Arda Est</Text>
          </View>
        </View>
        <View style={[styles.mapPin, { top: '58%', left: '58%' as any }]}>
          <View style={[styles.mapPinBubble, { backgroundColor: A }]}>
            <MaterialIcons name="restaurant" size={11} color={AD} />
            <Text style={[styles.mapPinText, { color: AD }]}>Secchia Ovest</Text>
          </View>
        </View>

        {/* Map action buttons */}
        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapActionBtn}>
            <MaterialIcons name="my-location" size={20} color={P} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapActionBtn}>
            <MaterialIcons name="layers" size={20} color={P} />
          </TouchableOpacity>
        </View>

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <MaterialIcons name="touch-app" size={14} color="#fff" />
          <Text style={styles.tapHintText}>TOCCA LA MAPPA PER AGGIUNGERE PIN</Text>
        </View>
      </View>

      {/* ── ROUTE DETAILS SHEET ─────────────────────────────────────────── */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Trip name */}
        <View style={styles.tripNameArea}>
          <Text style={styles.tripNameLabel}>IDENTITÀ DEL VIAGGIO</Text>
          <View style={styles.tripNameInput}>
            <MaterialIcons name="edit-road" size={20} color={P} />
            <TextInput
              style={styles.tripNameText}
              value={tripName}
              onChangeText={setTripName}
              placeholder="Nome del viaggio..."
              placeholderTextColor="#BEC9C5"
            />
          </View>
        </View>

        {/* Waypoints */}
        <View style={styles.waypointsArea}>
          <View style={styles.waypointsHeader}>
            <Text style={styles.waypointsTitle}>Waypoints</Text>
            <Text style={styles.waypointsCount}>{waypoints.length} TAPPE PIANIFICATE</Text>
          </View>

          {waypoints.map(wp => (
            <View key={wp.id} style={styles.waypointRow}>
              <MaterialIcons name="drag-indicator" size={20} color="#BEC9C5" />
              <View style={styles.waypointInfo}>
                <View style={styles.waypointNameRow}>
                  <View style={[styles.waypointDot, { backgroundColor: wp.dot }]} />
                  <Text style={styles.waypointName}>{wp.name}</Text>
                </View>
                <Text style={styles.waypointSub}>{wp.sub}</Text>
              </View>
              <TouchableOpacity
                onPress={() => removeWaypoint(wp.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="delete" size={20} color="rgba(186,26,26,0.4)" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add stop */}
          <TouchableOpacity style={styles.addStopBtn} activeOpacity={0.8}>
            <MaterialIcons name="add-circle" size={20} color="#6E7976" />
            <Text style={styles.addStopText}>AGGIUNGI NUOVA TAPPA</Text>
          </TouchableOpacity>
        </View>

        {/* Summary chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <MaterialIcons name="schedule"         size={14} color={P} />
            <Text style={styles.chipText}>5H 45M</Text>
          </View>
          <View style={styles.chip}>
            <MaterialIcons name="straighten"       size={14} color={P} />
            <Text style={styles.chipText}>578 KM</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#FFDF9E' }]}>
            <MaterialIcons name="local-gas-station" size={14} color={AD} />
            <Text style={[styles.chipText, { color: AD }]}>1 RIFORNIMENTO</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── SAVE ROUTE BUTTON ───────────────────────────────────────────── */}
      <View style={[styles.saveArea, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.88}>
          <MaterialIcons name="task-alt" size={20} color={AD} />
          <Text style={styles.saveBtnText}>Salva Percorso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#ECF4FF', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerTitle:  { fontSize: 18, fontWeight: '900', color: P, letterSpacing: -0.3 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#DAE3EF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(0,79,69,0.1)',
  },

  // ── Map placeholder ───────────────────────────────────────────────────────
  mapArea: { height: 260, overflow: 'hidden', position: 'relative' },
  mapBg:   {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#D2DBE6',
  },
  mapLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(160,220,200,0.3)',
  },
  mapPin: { position: 'absolute' },
  mapPinBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: P, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  mapPinText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  mapActions: { position: 'absolute', top: 12, right: 12, gap: 8 },
  mapActionBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6,
  },
  tapHint: {
    position: 'absolute', bottom: 16, alignSelf: 'center',
    backgroundColor: 'rgba(0,79,69,0.9)', paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  tapHintText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 1 },

  // ── Sheet ─────────────────────────────────────────────────────────────────
  sheet: {
    flex: 1, backgroundColor: '#fff', marginTop: -24,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  sheetContent: { padding: 24, gap: 24 },

  // ── Trip name ─────────────────────────────────────────────────────────────
  tripNameArea:  { gap: 8 },
  tripNameLabel: {
    fontSize: 10, fontWeight: '700', color: '#6E7976',
    letterSpacing: 1.8, textTransform: 'uppercase',
  },
  tripNameInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ECF4FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
  },
  tripNameText: { flex: 1, fontSize: 17, fontWeight: '700', color: '#141C25' },

  // ── Waypoints ─────────────────────────────────────────────────────────────
  waypointsArea: { gap: 10 },
  waypointsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  waypointsTitle: { fontSize: 22, fontWeight: '800', color: P, letterSpacing: -0.3 },
  waypointsCount: {
    fontSize: 11, color: '#6E7976', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  waypointRow: {
    backgroundColor: '#ECF4FF', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  waypointInfo:    { flex: 1 },
  waypointNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waypointDot:     { width: 8, height: 8, borderRadius: 4 },
  waypointName:    { fontSize: 15, fontWeight: '700', color: '#141C25' },
  waypointSub: {
    fontSize: 10, fontWeight: '600', color: '#6E7976',
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2, marginLeft: 16,
  },
  addStopBtn: {
    borderWidth: 1, borderColor: '#BEC9C5', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FAFCFF',
  },
  addStopText: { fontSize: 11, fontWeight: '700', color: '#6E7976', letterSpacing: 1 },

  // ── Summary chips ─────────────────────────────────────────────────────────
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E0E9F5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: '#3E4946' },

  // ── Save button ───────────────────────────────────────────────────────────
  saveArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: 'rgba(247,249,255,0.97)',
  },
  saveBtn: {
    backgroundColor: A, borderRadius: 999, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    elevation: 6, shadowColor: A, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: AD },
});
