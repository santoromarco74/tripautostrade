import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceAreaScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';
import { ServiceArea } from '../data/serviceAreas';

type ServiceKey = keyof Pick<
  ServiceArea,
  'has_restaurant' | 'has_cafe' | 'has_showers' | 'has_wifi' | 'pet_friendly' | 'ev_charging'
>;

type ServicesState = Record<ServiceKey, boolean>;

const SERVICES: { key: ServiceKey; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { key: 'has_restaurant', icon: 'restaurant',  label: 'Ristorante' },
  { key: 'has_cafe',       icon: 'cafe',         label: 'Bar/Caffè' },
  { key: 'has_showers',    icon: 'water',        label: 'Docce' },
  { key: 'has_wifi',       icon: 'wifi',         label: 'Wi-Fi' },
  { key: 'pet_friendly',   icon: 'paw',          label: 'Animali' },
  { key: 'ev_charging',    icon: 'flash',        label: 'Ricarica EV' },
];

function servicesFromArea(area: ServiceArea): ServicesState {
  return {
    has_restaurant: area.has_restaurant ?? false,
    has_cafe:       area.has_cafe       ?? false,
    has_showers:    area.has_showers    ?? false,
    has_wifi:       area.has_wifi       ?? false,
    pet_friendly:   area.pet_friendly   ?? false,
    ev_charging:    area.ev_charging    ?? false,
  };
}

export default function ServiceAreaScreen({ route }: ServiceAreaScreenProps) {
  const { area } = route.params;
  const { user } = useAuth();

  const [services, setServices] = useState<ServicesState>(servicesFromArea(area));
  const [modalVisible, setModalVisible] = useState(false);
  const [draft, setDraft] = useState<ServicesState>({ ...services });
  const [isSaving, setIsSaving] = useState(false);

  const openModal = () => {
    setDraft({ ...services });
    setModalVisible(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('service_areas')
      .update(draft)
      .eq('id', area.id);
    setIsSaving(false);

    if (error) {
      Alert.alert('Errore', 'Impossibile salvare i servizi. Riprova più tardi.');
      return;
    }

    setServices({ ...draft });
    setModalVisible(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Intestazione */}
      <Text style={styles.nome}>{area.name}</Text>
      <Text style={styles.brand}>{area.brand}</Text>

      {(area.highway || area.km != null) && (
        <Text style={styles.info}>
          {[area.highway, area.km != null ? `Km ${area.km}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      )}

      {area.direction && (
        <Text style={styles.direzione}>Direzione: {area.direction}</Text>
      )}

      {/* Riga icone servizi */}
      <View style={styles.serviziCard}>
        <Text style={styles.serviziTitolo}>Servizi disponibili</Text>
        <View style={styles.serviziRow}>
          {SERVICES.map(({ key, icon, label }) => (
            <View key={key} style={styles.servizioItem}>
              <Ionicons
                name={icon}
                size={28}
                color={services[key] ? Colors.primary : '#ccc'}
              />
              <Text style={[styles.servizioLabel, !services[key] && styles.servizioLabelOff]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottone Segnala Servizi — solo per utenti autenticati */}
      {user && (
        <TouchableOpacity style={styles.btnSegnala} onPress={openModal} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnSegnalaTesto}>Segnala Servizi</Text>
        </TouchableOpacity>
      )}

      {/* Modal con Switch per ogni servizio */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitolo}>Segnala Servizi</Text>
            <Text style={styles.modalSottotitolo}>
              Indica quali servizi sono disponibili in quest'area
            </Text>

            {SERVICES.map(({ key, icon, label }) => (
              <View key={key} style={styles.switchRow}>
                <Ionicons
                  name={icon}
                  size={22}
                  color={draft[key] ? Colors.primary : '#aaa'}
                  style={styles.switchIcon}
                />
                <Text style={styles.switchLabel}>{label}</Text>
                <Switch
                  value={draft[key]}
                  onValueChange={(val) => setDraft((prev) => ({ ...prev, [key]: val }))}
                  trackColor={{ false: '#e0e0e0', true: Colors.primary + '88' }}
                  thumbColor={draft[key] ? Colors.primary : '#f0f0f0'}
                />
              </View>
            ))}

            <View style={styles.modalBottoniera}>
              <TouchableOpacity
                style={styles.btnAnnulla}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnAnnullaTesto}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSalva, isSaving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Text style={styles.btnSalvaTesto}>
                  {isSaving ? 'Salvataggio…' : 'Salva'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    gap: 16,
  },

  // ── Intestazione ──────────────────────────────────────────────────────────
  nome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  brand: {
    fontSize: 15,
    color: '#666',
  },
  info: {
    fontSize: 14,
    color: '#444',
  },
  direzione: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
  },

  // ── Servizi ───────────────────────────────────────────────────────────────
  serviziCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  serviziTitolo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviziRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  servizioItem: {
    alignItems: 'center',
    width: '28%',
    gap: 6,
  },
  servizioLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  servizioLabelOff: {
    color: '#bbb',
  },

  // ── Bottone Segnala ───────────────────────────────────────────────────────
  btnSegnala: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSegnalaTesto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitolo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalSottotitolo: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchIcon: {
    marginRight: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  modalBottoniera: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  btnAnnulla: {
    flex: 1,
    backgroundColor: '#f1f3f4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnAnnullaTesto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  btnSalva: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSalvaTesto: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
