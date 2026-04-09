import { useRef, useState } from 'react';
import {
  Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P   = '#004F45';
const PC  = '#00695C';
const A   = '#FDC003';
const AD  = '#785900';
const BG  = '#F7F9FF';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    id: '1',
    icon: 'map' as const,
    iconColor: '#A0F2E1',
    bgColor: P,
    accent: A,
    titolo: "Trova l'area giusta",
    testo: 'Scopri le aree di servizio lungo il tuo percorso con tutti i dettagli e le recensioni della community.',
  },
  {
    id: '2',
    icon: 'star' as const,
    iconColor: A,
    bgColor: '#1A3A35',
    accent: A,
    titolo: 'La voce dei viaggiatori',
    testo: 'Leggi le recensioni autentiche e scopri i posti migliori per la tua sosta in autostrada.',
  },
  {
    id: '3',
    icon: 'emoji-events' as const,
    iconColor: A,
    bgColor: PC,
    accent: A,
    titolo: 'Guadagna punti viaggio',
    testo: 'Scrivi recensioni, completa sfide e scala la classifica dei viaggiatori più esperti.',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const handleStart = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      {/* ── SLIDE HEADER ────────────────────────────────────────────────── */}
      <View style={styles.brandBar}>
        <Text style={styles.brandText}>TripAutostrade</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Icon circle */}
            <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
              {/* Decorative rings */}
              <View style={[styles.iconRingOuter, { borderColor: `${item.accent}20` }]} />
              <View style={[styles.iconRingInner, { borderColor: `${item.accent}30` }]} />
              <MaterialIcons name={item.icon} size={72} color={item.iconColor} />
            </View>

            {/* Content */}
            <View style={styles.slideContent}>
              <Text style={styles.titolo}>{item.titolo}</Text>
              <Text style={styles.testo}>{item.testo}</Text>
            </View>
          </View>
        )}
      />

      {/* ── DOTS ────────────────────────────────────────────────────────── */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotAttivo : styles.dotInattivo,
            ]}
          />
        ))}
      </View>

      {/* ── ACTIONS ─────────────────────────────────────────────────────── */}
      <View style={styles.btnArea}>
        {activeIndex < SLIDES.length - 1 ? (
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={handleStart} activeOpacity={0.7}>
              <Text style={styles.skipText}>Salta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnNext} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.btnNextTesto}>Avanti</Text>
              <MaterialIcons name="arrow-forward" size={18} color={AD} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.btnStart} onPress={handleStart} activeOpacity={0.85}>
            <MaterialIcons name="directions-car" size={22} color={AD} />
            <Text style={styles.btnStartTesto}>Inizia a Viaggiare</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG, alignItems: 'center',
  },

  // ── Brand bar ─────────────────────────────────────────────────────────────
  brandBar: { paddingTop: 16, paddingBottom: 8 },
  brandText: {
    fontSize: 20, fontWeight: '900', color: P, fontStyle: 'italic', letterSpacing: -0.5,
  },

  // ── Slide ─────────────────────────────────────────────────────────────────
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 24,
  },
  iconCircle: {
    width: 200, height: 200, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
    elevation: 8, shadowColor: P, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20,
  },
  iconRingOuter: {
    position: 'absolute', top: -12, left: -12, right: -12, bottom: -12,
    borderRadius: 112, borderWidth: 2,
  },
  iconRingInner: {
    position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
    borderRadius: 106, borderWidth: 1.5,
  },
  slideContent: { alignItems: 'center' },
  titolo: {
    fontSize: 28, fontWeight: '800', color: P,
    textAlign: 'center', marginBottom: 16, letterSpacing: -0.3,
  },
  testo: {
    fontSize: 16, color: '#3E4946',
    textAlign: 'center', lineHeight: 24,
  },

  // ── Dots ──────────────────────────────────────────────────────────────────
  dotsRow: { flexDirection: 'row', gap: 8, marginVertical: 24 },
  dot:        { height: 8, borderRadius: 4 },
  dotAttivo:  { width: 28, backgroundColor: P },
  dotInattivo:{ width: 8,  backgroundColor: '#BEC9C5' },

  // ── Buttons ───────────────────────────────────────────────────────────────
  btnArea: { width: '100%', paddingHorizontal: 28 },
  btnRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skipText: { fontSize: 15, fontWeight: '600', color: '#6E7976' },
  btnNext: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999,
    backgroundColor: A,
  },
  btnNextTesto:  { fontSize: 16, fontWeight: '700', color: AD },
  btnStart: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: 999, backgroundColor: A,
    elevation: 6, shadowColor: A, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12,
  },
  btnStartTesto: { fontSize: 17, fontWeight: '800', color: AD, letterSpacing: 0.2 },
});
