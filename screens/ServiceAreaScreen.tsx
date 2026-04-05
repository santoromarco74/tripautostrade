import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, Alert, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

type ServiceAreaScreenProps = NativeStackScreenProps<any, 'ServiceArea'>;

export default function ServiceAreaScreen({ route, navigation }: ServiceAreaScreenProps) {
  const { area } = route.params || {};

  const [serviceArea, setServiceArea] = useState(area);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const { recensioni, toggleLike } = useReviews();

  // Recensioni filtrate per questa area, già con likeCount e likedByMe
  const reviews = recensioni.filter((r) => r.areaId === String(serviceArea.id));

  // --- STATI PER IL MODAL DEI SERVIZI ---
  const [isServicesModalVisible, setIsServicesModalVisible] = useState(false);
  const [localAmenities, setLocalAmenities] = useState({
    has_restaurant: serviceArea?.has_restaurant || false,
    has_cafe: serviceArea?.has_cafe || false,
    has_wifi: serviceArea?.has_wifi || false,
    has_showers: serviceArea?.has_showers || false,
    pet_friendly: serviceArea?.pet_friendly || false,
    ev_charging: serviceArea?.ev_charging || false,
  });


  // --- FUNZIONE PER SALVARE I SERVIZI ---
  const handleSaveAmenities = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('service_areas')
        .update({
          has_restaurant: localAmenities.has_restaurant,
          has_cafe: localAmenities.has_cafe,
          has_wifi: localAmenities.has_wifi,
          has_showers: localAmenities.has_showers,
          pet_friendly: localAmenities.pet_friendly,
          ev_charging: localAmenities.ev_charging
        })
        .eq('id', serviceArea.id);

      if (error) throw error;

      Alert.alert('Grazie!', 'I servizi sono stati aggiornati per tutti i viaggiatori.');
      
      // Aggiorniamo la grafica con i nuovi colori
      setServiceArea({ ...serviceArea, ...localAmenities });
      setIsServicesModalVisible(false);
      
    } catch (error) {
      Alert.alert('Errore', 'Impossibile aggiornare i servizi.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. INTESTAZIONE */}
      <View style={styles.headerCard}>
        <Text style={styles.areaName}>{serviceArea.name || 'Area di Servizio'}</Text>
        
        {/* 2. ICONE DEI SERVIZI */}
        <View style={styles.amenitiesRow}>
          <Ionicons name="restaurant" size={28} color={serviceArea?.has_restaurant ? '#E85D04' : '#e0e0e0'} />
          <Ionicons name="cafe" size={28} color={serviceArea?.has_cafe ? '#6F4E37' : '#e0e0e0'} />
          <Ionicons name="wifi" size={28} color={serviceArea?.has_wifi ? '#007BFF' : '#e0e0e0'} />
          <Ionicons name="paw" size={28} color={serviceArea?.pet_friendly ? '#28A745' : '#e0e0e0'} />
          <Ionicons name="water" size={28} color={serviceArea?.has_showers ? '#17A2B8' : '#e0e0e0'} />
          <Ionicons name="battery-charging" size={28} color={serviceArea?.ev_charging ? '#20C997' : '#e0e0e0'} />
        </View>

        {/* 3. BOTTONE SEGNALA SERVIZI (Solo se loggato) */}
        {user && (
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => setIsServicesModalVisible(true)}
          >
            <Ionicons name="pencil" size={16} color="#333" />
            <Text style={styles.updateButtonText}> Segnala Servizi</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4. SEZIONE RECENSIONI */}
      <View style={styles.reviewsContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={styles.sectionTitle}>Recensioni ({reviews.length})</Text>
          {user && (
            <TouchableOpacity onPress={() => navigation.navigate('AddReview', { area: serviceArea })}>
              <Text style={{ color: '#007BFF', fontWeight: 'bold' }}>+ Scrivi</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={{ color: 'gray' }}>Nessuna recensione. Sii il primo a scriverne una!</Text>}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewAutore}>{item.autore}</Text>
              <Text style={styles.reviewStelle}>{'★'.repeat(item.stelle)}{'☆'.repeat(5 - item.stelle)}</Text>
              <Text style={styles.reviewTesto}>{item.testo}</Text>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.reviewImage}
                  resizeMode="cover"
                />
              )}
              {/* Bottone Like */}
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
                {item.likeCount > 0 && (
                  <Text style={[styles.likeCount, item.likedByMe && styles.likeCountAttivo]}>
                    {item.likeCount}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* 5. IL MODAL A COMPARSA PER GLI SWITCH */}
      <Modal visible={isServicesModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quali servizi sono presenti?</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🍝 Ristorante</Text>
              <Switch value={localAmenities.has_restaurant} onValueChange={(v) => setLocalAmenities({...localAmenities, has_restaurant: v})} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>☕ Bar / Caffetteria</Text>
              <Switch value={localAmenities.has_cafe} onValueChange={(v) => setLocalAmenities({...localAmenities, has_cafe: v})} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>📶 Wi-Fi Gratuito</Text>
              <Switch value={localAmenities.has_wifi} onValueChange={(v) => setLocalAmenities({...localAmenities, has_wifi: v})} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🐕 Area Cani (Pet Friendly)</Text>
              <Switch value={localAmenities.pet_friendly} onValueChange={(v) => setLocalAmenities({...localAmenities, pet_friendly: v})} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🚿 Docce</Text>
              <Switch value={localAmenities.has_showers} onValueChange={(v) => setLocalAmenities({...localAmenities, has_showers: v})} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>⚡ Ricarica Elettrica</Text>
              <Switch value={localAmenities.ev_charging} onValueChange={(v) => setLocalAmenities({...localAmenities, ev_charging: v})} />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveAmenities} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Salva Modifiche</Text>}
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

// --- STILI ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  areaName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  amenitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  updateButton: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  cancelButtonText: {
    color: 'gray',
    fontSize: 16,
  },
  reviewCard: {
    padding: 15,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 1,
  },
  reviewAutore: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.text,
  },
  reviewStelle: {
    color: Colors.accent,
    fontSize: 16,
    marginVertical: 4,
  },
  reviewTesto: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 10,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  likeCountAttivo: {
    color: '#E53935',
  },
});