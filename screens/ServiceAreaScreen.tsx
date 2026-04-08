import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Switch, Alert, FlatList, ActivityIndicator, ScrollView,
  Image, Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useReviews, Recensione } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { ReviewCard } from '../components/ReviewCard';
import { ReportModal } from '../components/ReportModal';
import { SortFilterBar, SortOption } from '../components/SortFilterBar';
import { useFavorites } from '../context/FavoritesContext';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P  = '#004F45'; // Verde Autostrada
const A  = '#FDC003'; // Amber
const AD = '#785900'; // Amber dark (testo su amber)
const BG = '#F7F9FF'; // Background
const SF = '#E6EFFA'; // Surface container
const SL = '#ECF4FF'; // Surface container low

// Fallback Unsplash per aree senza image_url
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80';

type ServiceAreaScreenProps = NativeStackScreenProps<any, 'ServiceArea'>;

const AMENITY_CHIPS = [
  { key: 'has_restaurant', label: 'Ristorante',   icon: 'restaurant'     as const, subLabel: 'Brand',        amber: false },
  { key: 'ev_charging',    label: 'Ionity 350kW', icon: 'ev-station'     as const, subLabel: 'Charging',     amber: true  },
  { key: 'has_wifi',       label: 'Wi-Fi Gratis', icon: 'wifi'           as const, subLabel: 'Connectivity', amber: false },
  { key: 'has_cafe',       label: 'Bar',           icon: 'local-cafe'     as const, subLabel: 'Food',         amber: false },
  { key: 'pet_friendly',   label: 'Area Pet',      icon: 'pets'           as const, subLabel: 'Facilities',   amber: false },
  { key: 'has_showers',    label: 'Docce',          icon: 'shower'         as const, subLabel: 'Facilities',   amber: false },
] as const;

export default function ServiceAreaScreen({ route, navigation }: ServiceAreaScreenProps) {
  const { area } = route.params || {};
  const insets = useSafeAreaInsets();

  const [serviceArea, setServiceArea]           = useState(area);
  const [isLoading, setIsLoading]               = useState(false);
  const [isServicesModalVisible, setIsServicesModalVisible] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [sortOption, setSortOption]             = useState<SortOption>('recent');

  const [localAmenities, setLocalAmenities] = useState({
    has_restaurant: serviceArea?.has_restaurant || false,
    has_cafe:       serviceArea?.has_cafe       || false,
    has_wifi:       serviceArea?.has_wifi       || false,
    has_showers:    serviceArea?.has_showers    || false,
    pet_friendly:   serviceArea?.pet_friendly   || false,
    ev_charging:    serviceArea?.ev_charging    || false,
  });

  const { user }                           = useAuth();
  const { recensioni, toggleLike }         = useReviews();
  const { isFavorite, toggleFavorite }     = useFavorites();
  const areaIsFavorite                     = isFavorite(serviceArea.id);
  const reviews                            = recensioni.filter((r) => r.areaId === String(serviceArea.id));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.stelle, 0) / reviews.length).toFixed(1)
    : null;

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sortOption) {
      case 'highest':
        return sorted.sort((a, b) => b.stelle - a.stelle || b.data.localeCompare(a.data));
      case 'lowest':
        return sorted.sort((a, b) => a.stelle - b.stelle || b.data.localeCompare(a.data));
      case 'most_helpful':
        return sorted.sort((a, b) => b.likeCount - a.likeCount || b.stelle - a.stelle);
      default:
        return sorted;
    }
  }, [reviews, sortOption]);

  const handleSaveAmenities = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('service_areas')
        .update(localAmenities)
        .eq('id', serviceArea.id);
      if (error) throw error;
      Alert.alert('Grazie!', 'I servizi sono stati aggiornati per tutti i viaggiatori.');
      setServiceArea({ ...serviceArea, ...localAmenities });
      setIsServicesModalVisible(false);
    } catch {
      Alert.alert('Errore', 'Impossibile aggiornare i servizi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigate = () => {
    const lat = serviceArea?.latitude;
    const lng = serviceArea?.longitude;
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  };

  const heroImageUri: string = (serviceArea as any)?.image_url || HERO_FALLBACK;
  const activeChips = AMENITY_CHIPS.filter((c) => serviceArea?.[c.key]);

  const listHeader = (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: heroImageUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {/* Dark gradient overlay (simulated) */}
        <View style={styles.heroGradientTop} />
        <View style={styles.heroGradientBottom} />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Bottom hero info */}
        <View style={styles.heroBottom}>
          <View style={styles.heroTags}>
            {serviceArea?.highway && (
              <View style={styles.tagAmber}>
                <Text style={styles.tagAmberText}>{serviceArea.highway}</Text>
              </View>
            )}
            {serviceArea?.km != null && (
              <View style={styles.tagGlass}>
                <Text style={styles.tagGlassText}>KM {serviceArea.km}</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroTitle}>{serviceArea?.name || 'Area di Servizio'}</Text>
          {serviceArea?.brand && (
            <Text style={styles.heroSubtitle}>{serviceArea.brand}</Text>
          )}
        </View>

        {/* Floating favorite button */}
        {user && (
          <TouchableOpacity
            style={styles.favButton}
            onPress={() => toggleFavorite(serviceArea.id)}
          >
            <MaterialIcons
              name={areaIsFavorite ? 'favorite' : 'favorite-border'}
              size={26}
              color={areaIsFavorite ? '#E21937' : AD}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ── SERVICE DETAIL SHEET ─────────────────────────────────────────── */}
      <View style={styles.sheet}>

        {/* Chips orizzontali */}
        {activeChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {activeChips.map((chip) => (
              <View key={chip.key} style={[styles.chip, chip.amber && styles.chipAmber]}>
                <MaterialIcons
                  name={chip.icon}
                  size={22}
                  color={chip.amber ? AD : P}
                />
                <View>
                  <Text style={[styles.chipSubLabel, chip.amber && { color: AD }]}>
                    {chip.subLabel}
                  </Text>
                  <Text style={[styles.chipLabel, chip.amber && { color: '#261a00' }]}>
                    {chip.label}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Bento grid */}
        <View style={styles.bentoGrid}>
          {/* About — full width */}
          <View style={styles.bentoAbout}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bentoAboutTitle}>Riguardo a questa sosta</Text>
              <Text style={styles.bentoAboutDesc}>
                {(serviceArea as any)?.description ||
                  `Area di servizio${serviceArea?.highway ? ' sulla ' + serviceArea.highway : ''}.`}
              </Text>
            </View>
            <MaterialIcons name="info" size={40} color={P} style={{ opacity: 0.18 }} />
          </View>

          {/* Two small tiles */}
          <View style={styles.bentoRow}>
            <View style={styles.bentoTile}>
              <MaterialIcons name="pets" size={24} color={P} />
              <Text style={styles.bentoTileTitle}>Area Pet</Text>
              <Text style={styles.bentoTileDesc}>Spazio recintato disponibile</Text>
            </View>
            <View style={styles.bentoTile}>
              <MaterialIcons name="local-parking" size={24} color={P} />
              <Text style={styles.bentoTileTitle}>Parcheggio TIR</Text>
              <Text style={styles.bentoTileDesc}>Slot per veicoli pesanti</Text>
            </View>
          </View>
        </View>

        {/* Reviews header */}
        <View style={styles.reviewsHeader}>
          <View>
            <Text style={styles.reviewsTitle}>Voci dei Viaggiatori</Text>
            {reviews.length > 0 && (
              <Text style={styles.reviewsCount}>
                {reviews.length} {reviews.length === 1 ? 'recensione' : 'recensioni'}
              </Text>
            )}
          </View>
          {avgRating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingNumber}>{avgRating}</Text>
              <MaterialIcons name="star" size={20} color="#F59E0B" />
            </View>
          )}
        </View>

        {/* Sort bar */}
        {reviews.length > 1 && (
          <SortFilterBar activeSort={sortOption} onSortChange={setSortOption} />
        )}

        {/* Segnala servizi */}
        {user && (
          <TouchableOpacity
            style={styles.segnalaButton}
            onPress={() => setIsServicesModalVisible(true)}
          >
            <MaterialIcons name="edit" size={14} color={P} />
            <Text style={styles.segnalaText}>Segnala Servizi</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedReviews}
        keyExtractor={(item: Recensione) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={styles.emptyTesto}>Nessuna recensione ancora. Sii il primo!</Text>
        }
        renderItem={({ item }: { item: Recensione }) => (
          <View style={styles.reviewWrapper}>
            <ReviewCard
              item={item}
              showAuthor
              currentUserId={user?.id}
              onToggleLike={toggleLike}
              onReport={(id) => setReportingReviewId(id)}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footerWrapper}>
            <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
              <MaterialIcons name="navigation" size={22} color="#fff" />
              <Text style={styles.navigateButtonText}>Naviga qui</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB scrivi recensione */}
      {user && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => navigation.navigate('WriteReview', { area: serviceArea })}
          activeOpacity={0.85}
        >
          <MaterialIcons name="rate-review" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Report Modal */}
      <ReportModal
        visible={reportingReviewId !== null}
        reviewId={reportingReviewId}
        onClose={() => setReportingReviewId(null)}
      />

      {/* Services Modal */}
      <Modal visible={isServicesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>Quali servizi sono presenti?</Text>
            {[
              { key: 'has_restaurant', label: '🍝 Ristorante' },
              { key: 'has_cafe',       label: '☕ Bar / Caffetteria' },
              { key: 'has_wifi',       label: '📶 Wi-Fi Gratuito' },
              { key: 'pet_friendly',   label: '🐕 Pet Friendly' },
              { key: 'has_showers',    label: '🚿 Docce' },
              { key: 'ev_charging',    label: '⚡ Ricarica EV' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.switchRow}>
                <Text style={styles.switchLabel}>{label}</Text>
                <Switch
                  value={localAmenities[key as keyof typeof localAmenities]}
                  onValueChange={(v: boolean) => setLocalAmenities({ ...localAmenities, [key]: v })}
                  trackColor={{ true: P }}
                  thumbColor={localAmenities[key as keyof typeof localAmenities] ? A : '#f0f0f0'}
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAmenities}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Salva Modifiche</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsServicesModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  heroContainer: {
    height: 360,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: 'rgba(0,79,69,0.85)',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 72,
  },
  heroTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tagAmber: {
    backgroundColor: A,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagAmberText: {
    color: AD,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tagGlass: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagGlassText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(160,242,225,0.9)',
    marginTop: 4,
  },
  favButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: A,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // ── Sheet sovrapposta ────────────────────────────────────────────────────────
  sheet: {
    backgroundColor: '#F7F9FF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -48,
    paddingTop: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  // ── Chips ────────────────────────────────────────────────────────────────────
  chipsRow: {
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: SF,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  chipAmber: {
    backgroundColor: '#FFDF9E',
  },
  chipSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6E7976',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#141C25',
  },

  // ── Bento grid ───────────────────────────────────────────────────────────────
  bentoGrid: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  bentoAbout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SL,
    borderRadius: 20,
    padding: 20,
  },
  bentoAboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: P,
    marginBottom: 6,
  },
  bentoAboutDesc: {
    fontSize: 13,
    color: '#3E4946',
    lineHeight: 19,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bentoTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(110,121,118,0.12)',
    gap: 8,
  },
  bentoTileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#141C25',
  },
  bentoTileDesc: {
    fontSize: 11,
    color: '#6E7976',
  },

  // ── Reviews ──────────────────────────────────────────────────────────────────
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  reviewsTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P,
  },
  reviewsCount: {
    fontSize: 13,
    color: '#6E7976',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: P,
  },
  segnalaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(0,79,69,0.07)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,79,69,0.18)',
  },
  segnalaText: {
    color: P,
    fontWeight: '700',
    fontSize: 13,
  },
  reviewWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyTesto: {
    color: '#6E7976',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },

  // ── Footer: navigate button ───────────────────────────────────────────────────
  footerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: P,
    paddingVertical: 18,
    borderRadius: 28,
    elevation: 6,
    shadowColor: P,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── FAB ──────────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: P,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: P,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // ── Modal servizi ─────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#141C25',
    marginBottom: 20,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(190,201,197,0.4)',
  },
  switchLabel: {
    fontSize: 15,
    color: '#141C25',
  },
  saveButton: {
    backgroundColor: P,
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  cancelButton: {
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6E7976',
    fontSize: 15,
  },
});
