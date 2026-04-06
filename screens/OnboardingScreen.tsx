import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../constants/Colors';
import { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    id: '1',
    icon: 'map-outline' as const,
    iconColor: Colors.primary,
    bgColor: '#E8F5E9',
    titolo: "Trova l'area giusta",
    testo: 'Scopri le aree di servizio lungo il tuo percorso con tutti i dettagli.',
  },
  {
    id: '2',
    icon: 'star-outline' as const,
    iconColor: '#F59E0B',
    bgColor: '#FFFBEB',
    titolo: 'La voce dei viaggiatori',
    testo: 'Leggi le recensioni autentiche e scopri i posti migliori per la tua sosta.',
  },
  {
    id: '3',
    icon: 'people-outline' as const,
    iconColor: '#6366F1',
    bgColor: '#EEF2FF',
    titolo: 'Fai la tua parte',
    testo: "Segnala i servizi attivi e scrivi recensioni per aiutare l'intera community.",
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
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
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
            {/* Icona con cerchio colorato */}
            <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon} size={72} color={item.iconColor} />
            </View>
            <Text style={styles.titolo}>{item.titolo}</Text>
            <Text style={styles.testo}>{item.testo}</Text>
          </View>
        )}
      />

      {/* Indicatori di pagina */}
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

      {/* Bottone: "Avanti" nelle prime slide, "Inizia a Viaggiare" nell'ultima */}
      <View style={styles.btnArea}>
        {activeIndex < SLIDES.length - 1 ? (
          <TouchableOpacity style={styles.btnNext} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.btnNextTesto}>Avanti</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnStart} onPress={handleStart} activeOpacity={0.85}>
            <Ionicons name="car-outline" size={22} color="#fff" />
            <Text style={styles.btnStartTesto}>Inizia a Viaggiare</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },

  // Slide
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  titolo: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  testo: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotAttivo: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  dotInattivo: {
    width: 8,
    backgroundColor: Colors.border,
  },

  // Bottoni
  btnArea: {
    width: '100%',
    paddingHorizontal: 28,
  },
  btnNext: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  btnNextTesto: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  btnStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  btnStartTesto: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
