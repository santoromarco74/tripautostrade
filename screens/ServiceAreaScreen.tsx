import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Switch, Alert, FlatList, ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

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
  const reviews = recensioni.filter((r) => r.areaId === String(serviceArea.id));

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
        data={reviews}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            Recensioni {reviews.length > 0 ? `(${reviews.length})` : ''}
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyTesto}>Nessuna recensione. Sii il primo!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAutore}>{item.autore}</Text>
              <Text style={styles.reviewData}>{item.data}</Text>
            </View>
            <Text style={styles.reviewStelle}>
              {'★'.repeat(item.stelle)}{'☆'.repeat(5 - item.stelle)}
            </Text>
            <Text style={styles.reviewTesto}>{item.testo}</Text>
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.reviewImage}
                resizeMode="cover"
              />
            )}
            {/* Like */}
            <View style={styles.likeDivider} />
            <TouchableOpacity
              style={styles.likeRow}
              onPress={() => toggleLike(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.likedByMe ? 'heart' : 'heart-outline'}
                size={20}
                color={item.likedByMe ? '#E53935' : '#94A3B8'}
              />
              <Text style={[styles.likeCount, item.likedByMe && styles.likeCountAttivo]}>
                {item.likeCount > 0 ? item.likeCount : 'Utile'}
              </Text>
            </TouchableOpacity>
          </View>
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
  emptyTesto: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },

  // ── Card recensione ───────────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewAutore: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  reviewData: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewStelle: {
    color: Colors.accent,
    fontSize: 16,
    marginBottom: 8,
  },
  reviewTesto: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 12,
  },
  likeDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 12,
    marginBottom: 10,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  likeCountAttivo: {
    color: '#E53935',
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
