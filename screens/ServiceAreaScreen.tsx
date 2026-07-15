import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Switch, Alert, FlatList, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { ReviewCard } from '../components/ReviewCard';
import { ReportModal } from '../components/ReportModal';
import { SortFilterBar, SortOption } from '../components/SortFilterBar';
import { useFavorites } from '../context/FavoritesContext';
import { CATEGORIE_PAGELLA } from '../constants/pagelle';

type ServiceAreaScreenProps = NativeStackScreenProps<any, 'ServiceArea'>;

// Definizione badge servizi con icona, etichetta e colore
const AMENITY_BADGES = [
  { key: 'has_restaurant', label: 'Ristorante', icon: 'restaurant',       color: '#E85D04' },
  { key: 'has_cafe',       label: 'Bar',         icon: 'cafe',             color: '#6F4E37' },
  { key: 'has_wifi',       label: 'Wi-Fi',       icon: 'wifi',             color: '#007BFF' },
  { key: 'pet_friendly',   label: 'Pet',          icon: 'paw',              color: '#28A745' },
  { key: 'has_showers',    label: 'Docce',        icon: 'water',            color: '#17A2B8' },
  { key: 'ev_charging',    label: 'EV',           icon: 'battery-charging', color: '#20C997' },
] as const;

export default function ServiceAreaScreen({ route, navigation }: ServiceAreaScreenProps) {
  const { area } = route.params || {};

  const [serviceArea, setServiceArea] = useState(area);
  const [isLoading, setIsLoading] = useState(false);
  const [isServicesModalVisible, setIsServicesModalVisible] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const [localAmenities, setLocalAmenities] = useState({
    has_restaurant: serviceArea?.has_restaurant || false,
    has_cafe:       serviceArea?.has_cafe       || false,
    has_wifi:       serviceArea?.has_wifi       || false,
    has_showers:    serviceArea?.has_showers    || false,
    pet_friendly:   serviceArea?.pet_friendly   || false,
    ev_charging:    serviceArea?.ev_charging    || false,
  });

  const { user } = useAuth();
  const { recensioni, toggleLike } = useReviews();
  const { isFavorite, toggleFavorite } = useFavorites();
  const areaIsFavorite = isFavorite(serviceArea.id);
  const reviews = recensioni.filter((r) => r.areaId === String(serviceArea.id));

  // Pagella dell'area: media per categoria su tutte le recensioni che l'hanno votata
  const pagellaArea = useMemo(() => {
    const acc: Record<string, { somma: number; n: number }> = {};
    for (const r of reviews) {
      if (!r.pagelle) continue;
      for (const c of CATEGORIE_PAGELLA) {
        const v = r.pagelle[c.key];
        if (v != null) {
          acc[c.key] = acc[c.key] ?? { somma: 0, n: 0 };
          acc[c.key].somma += v;
          acc[c.key].n += 1;
        }
      }
    }
    return CATEGORIE_PAGELLA
      .filter((c) => acc[c.key])
      .map((c) => ({ ...c, media: acc[c.key].somma / acc[c.key].n, n: acc[c.key].n }));
  }, [reviews]);

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

  // Badge servizi presenti (solo quelli true)
  const activeBadges = AMENITY_BADGES.filter((b) => serviceArea?.[b.key]);

  return (
    <View style={styles.container}>

      {/* ── 1. HEADER CARD con angoli arrotondati in basso ── */}
      <View style={styles.headerCard}>
        {user && (
          <TouchableOpacity
            style={styles.btnBookmark}
            onPress={() => toggleFavorite(serviceArea.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={areaIsFavorite ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={areaIsFavorite ? Colors.accent : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        <Text style={styles.areaName}>{serviceArea.name || 'Area di Servizio'}</Text>

        {/* ── 2. BADGE SERVIZI in ScrollView orizzontale ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgeRow}
        >
          {AMENITY_BADGES.map((b) => {
            const active = !!serviceArea?.[b.key];
            return (
              <View key={b.key} style={[styles.badge, !active && styles.badgeInattivo]}>
                <Ionicons
                  name={b.icon as any}
                  size={20}
                  color={active ? b.color : '#CBD5E1'}
                />
                <Text style={[styles.badgeLabel, !active && styles.badgeLabelInattivo]}>
                  {b.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottone segnala servizi */}
        {user && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => setIsServicesModalVisible(true)}
          >
            <Ionicons name="pencil-outline" size={15} color={Colors.primary} />
            <Text style={styles.updateButtonText}>Segnala Servizi</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 3. LISTA RECENSIONI ── */}
      <FlatList
        data={sortedReviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <View>
            {pagellaArea.length > 0 && (
              <View style={styles.pagellaCard}>
                <Text style={styles.pagellaTitolo}>La pagella dell'area</Text>
                {pagellaArea.map((c) => (
                  <View key={c.key} style={styles.pagellaVoceRow}>
                    <Text style={styles.pagellaVoceLabel}>{c.emoji}  {c.label}</Text>
                    <View style={styles.pagellaVoceRight}>
                      <View style={styles.pagellaBarra}>
                        <View
                          style={[styles.pagellaBarraFill, { width: `${(c.media / 5) * 100}%` }]}
                        />
                      </View>
                      <Text style={styles.pagellaVoto}>{c.media.toFixed(1)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.sectionTitle}>
              Recensioni {reviews.length > 0 ? `(${reviews.length})` : ''}
            </Text>
            {reviews.length > 1 && (
              <SortFilterBar activeSort={sortOption} onSortChange={setSortOption} />
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyTesto}>Nessuna recensione. Sii il primo!</Text>
        }
        renderItem={({ item }) => (
          <ReviewCard
            item={item}
            showAuthor
            currentUserId={user?.id}
            onToggleLike={toggleLike}
            onReport={(id) => setReportingReviewId(id)}
          />
        )}
      />

      {/* ── 4. FAB Scrivi Recensione ── */}
      {user && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddReview', { area: serviceArea })}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── MODAL SEGNALAZIONE ── */}
      <ReportModal
        visible={reportingReviewId !== null}
        reviewId={reportingReviewId}
        onClose={() => setReportingReviewId(null)}
      />

      {/* ── MODAL SERVIZI ── */}
      <Modal visible={isServicesModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                  onValueChange={(v) => setLocalAmenities({ ...localAmenities, [key]: v })}
                  trackColor={{ true: Colors.primary }}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAmenities} disabled={isLoading}>
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Salva Modifiche</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsServicesModalVisible(false)}>
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
    backgroundColor: Colors.background,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerCard: {
    backgroundColor: Colors.surface,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    zIndex: 1,
  },
  btnBookmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    padding: 4,
  },
  areaName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },

  // ── Badge servizi ─────────────────────────────────────────────────────────
  badgeRow: {
    gap: 8,
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    minWidth: 58,
  },
  badgeInattivo: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
  },
  badgeLabelInattivo: {
    color: Colors.textSecondary,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#EEF9F7',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  updateButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Lista recensioni ──────────────────────────────────────────────────────
  lista: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },

  // ── Pagella dell'area ─────────────────────────────────────────────────────
  pagellaCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  pagellaTitolo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  pagellaVoceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pagellaVoceLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  pagellaVoceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 130,
  },
  pagellaBarra: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  pagellaBarraFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  pagellaVoto: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    width: 28,
    textAlign: 'right',
  },
  emptyTesto: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  switchLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
