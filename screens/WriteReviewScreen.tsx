import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageCompression';
import type { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P  = '#004F45'; // Verde Autostrada
const A  = '#FDC003'; // Amber
const AD = '#785900'; // Amber dark

type WriteReviewScreenProps = NativeStackScreenProps<RootStackParamList, 'WriteReview'>;

const STAR_LABELS = ['', 'Pessimo', 'Scarso', 'Nella norma', 'Buono', 'Eccellente'];

const AMENITY_TAGS = [
  { key: 'ev',     label: 'Ricarica EV',    icon: 'ev-station'  as const },
  { key: 'coffee', label: 'Caffè ottimo',   icon: 'local-cafe'  as const },
  { key: 'wc',     label: 'Bagni puliti',   icon: 'wc'          as const },
  { key: 'wifi',   label: 'Wi-Fi veloce',   icon: 'wifi'        as const },
];

export default function WriteReviewScreen({ route, navigation }: WriteReviewScreenProps) {
  const { area, recensioneEsistente } = route.params;
  const isEditing = !!recensioneEsistente;
  const insets = useSafeAreaInsets();

  const { addReview, updateReview } = useReviews();
  const { user }                    = useAuth();

  const [stelle, setStelle]         = useState(recensioneEsistente?.stelle ?? 0);
  const [commento, setCommento]     = useState(recensioneEsistente?.testo ?? '');
  const [foto, setFoto]             = useState<{ uri: string; base64: string } | null>(null);
  const [fotoUrlEsistente, setFotoUrlEsistente] = useState<string | undefined>(
    recensioneEsistente?.imageUrl
  );
  const [publishing, setPublishing] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const sceglieFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', "Abilita l'accesso alla galleria nelle impostazioni.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      const compressed = await compressImage(result.assets[0].uri);
      setFoto(compressed);
      setFotoUrlEsistente(undefined);
    }
  };

  const pubblica = async () => {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      Alert.alert(
        'Sei Offline 📶',
        'Devi essere connesso a internet per pubblicare una recensione.'
      );
      return;
    }
    if (!user) {
      Alert.alert('Non autenticato', 'Devi essere loggato per inviare una recensione.');
      return;
    }
    if (stelle === 0) {
      Alert.alert('Valutazione mancante', 'Seleziona almeno una stella.');
      return;
    }
    if (commento.trim().length < 10) {
      Alert.alert('Commento troppo corto', 'Scrivi almeno 10 caratteri.');
      return;
    }
    setPublishing(true);
    try {
      if (isEditing) {
        await updateReview({
          id: recensioneEsistente.id,
          stelle,
          testo: commento.trim(),
          ...(foto ? { fotoBase64: foto.base64 } : {}),
        });
        Alert.alert('Recensione aggiornata!', undefined, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addReview({
          areaId: area.id,
          stelle,
          testo: commento.trim(),
          ...(foto ? { fotoBase64: foto.base64 } : {}),
        });
        Alert.alert('Recensione inviata!', undefined, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      Alert.alert('Errore', message);
    } finally {
      setPublishing(false);
    }
  };

  const fotoUri = foto?.uri ?? fotoUrlEsistente;

  const toggleTag = (key: string) => {
    setSelectedTags((prev: string[]) =>
      prev.includes(key) ? prev.filter((t: string) => t !== key) : [...prev, key]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color="#A0F2E1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Modifica Recensione' : 'Scrivi una Recensione'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── AREA IDENTITY ──────────────────────────────────────────────── */}
        <View style={styles.areaCard}>
          <View style={styles.areaThumbnail}>
            <Text style={styles.areaThumbnailText}>
              {area.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.areaName}>{area.name}</Text>
            <View style={styles.areaLocation}>
              <MaterialIcons name="location-on" size={14} color="#6E7976" />
              <Text style={styles.areaLocationText}>
                {area.brand}
                {area.highway ? ` · ${area.highway}` : ''}
                {area.km != null ? ` Km ${area.km}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* ── STAR RATING CARD ───────────────────────────────────────────── */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingQuestion}>Com'è andata la tua visita?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setStelle(n)} activeOpacity={0.7}>
                <MaterialIcons
                  name={n <= stelle ? 'star' : 'star-border'}
                  size={44}
                  color={n <= stelle ? A : '#BEC9C5'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {stelle > 0 && (
            <Text style={styles.starLabel}>{STAR_LABELS[stelle]}</Text>
          )}
          <Text style={styles.tapToRate}>TAP PER VALUTARE</Text>
        </View>

        {/* ── COMMENT AREA ───────────────────────────────────────────────── */}
        <View style={styles.commentCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Racconta la tua esperienza... Com'era il caffè? I bagni erano puliti?"
            placeholderTextColor="#9CA3AF"
            multiline
            value={commento}
            onChangeText={setCommento}
            textAlignVertical="top"
          />
          <Text style={styles.charCounter}>{commento.length} caratteri</Text>
        </View>

        {/* ── MEDIA: bento grid ──────────────────────────────────────────── */}
        <View style={styles.mediaGrid}>
          {/* Add photo tile */}
          <TouchableOpacity style={styles.addPhotoTile} onPress={sceglieFoto}>
            <MaterialIcons name="add-a-photo" size={26} color={P} />
            <Text style={styles.addPhotoLabel}>AGGIUNGI{'\n'}FOTO</Text>
          </TouchableOpacity>

          {/* Photo preview */}
          {fotoUri ? (
            <View style={styles.photoTile}>
              <Image source={{ uri: fotoUri }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.deletePhotoBtn}
                onPress={() => { setFoto(null); setFotoUrlEsistente(undefined); }}
              >
                <MaterialIcons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.photoTile, styles.photoTileEmpty]} />
          )}

          {/* Third tile placeholder */}
          <View style={[styles.photoTile, styles.photoTileEmpty]} />
        </View>

        {/* ── AMENITY CHIPS ──────────────────────────────────────────────── */}
        <View style={styles.amenitiesCard}>
          <Text style={styles.amenitiesTitle}>EVIDENZIA I SERVIZI</Text>
          <View style={styles.tagsRow}>
            {AMENITY_TAGS.map((tag) => {
              const active = selectedTags.includes(tag.key);
              return (
                <TouchableOpacity
                  key={tag.key}
                  style={[styles.tag, active && styles.tagActive]}
                  onPress={() => toggleTag(tag.key)}
                  activeOpacity={0.75}
                >
                  <MaterialIcons
                    name={tag.icon}
                    size={15}
                    color={active ? '#fff' : '#3E4946'}
                  />
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── SUBMIT ─────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitButton, publishing && { opacity: 0.65 }]}
          onPress={pubblica}
          disabled={publishing}
          activeOpacity={0.88}
        >
          {publishing ? (
            <ActivityIndicator color={AD} />
          ) : (
            <>
              <Text style={styles.submitText}>
                {isEditing ? 'Aggiorna Recensione' : 'Invia Recensione'}
              </Text>
              <MaterialIcons name="send" size={20} color={AD} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Inviando accetti le nostre Linee Guida della Community.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FF',
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: 'rgba(0,79,69,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F0FFF9',
    letterSpacing: -0.3,
  },

  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },

  // ── Area identity ─────────────────────────────────────────────────────────────
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: P,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  areaThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: P,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaThumbnailText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#A0F2E1',
  },
  areaName: {
    fontSize: 20,
    fontWeight: '800',
    color: P,
    letterSpacing: -0.3,
  },
  areaLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  areaLocationText: {
    fontSize: 13,
    color: '#6E7976',
    fontWeight: '500',
  },

  // ── Star rating card ──────────────────────────────────────────────────────────
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: P,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  ratingQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#141C25',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  starLabel: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: AD,
  },
  tapToRate: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginTop: 8,
  },

  // ── Comment card ──────────────────────────────────────────────────────────────
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 2,
    shadowColor: P,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  textInput: {
    padding: 20,
    fontSize: 15,
    color: '#141C25',
    minHeight: 160,
    lineHeight: 22,
  },
  charCounter: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // ── Media grid ────────────────────────────────────────────────────────────────
  mediaGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  addPhotoTile: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#E0E9F5',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#BEC9C5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addPhotoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: P,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  photoTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoTileEmpty: {
    backgroundColor: '#E0E9F5',
    opacity: 0.4,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Amenity chips ─────────────────────────────────────────────────────────────
  amenitiesCard: {
    backgroundColor: '#ECF4FF',
    borderRadius: 20,
    padding: 18,
  },
  amenitiesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: P,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(190,201,197,0.3)',
    elevation: 1,
  },
  tagActive: {
    backgroundColor: P,
    borderColor: P,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3E4946',
  },
  tagTextActive: {
    color: '#fff',
  },

  // ── Submit button ─────────────────────────────────────────────────────────────
  submitButton: {
    backgroundColor: A,
    borderRadius: 28,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: A,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    marginTop: 8,
  },
  submitText: {
    fontSize: 17,
    fontWeight: '800',
    color: AD,
    letterSpacing: 0.2,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6E7976',
    lineHeight: 18,
  },
});
