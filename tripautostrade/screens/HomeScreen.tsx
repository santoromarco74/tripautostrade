import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HomeLoadingOverlay } from '../components/SkeletonLoader';
import { showLocation } from 'react-native-map-link';
import * as Location from 'expo-location';
import MapView from 'react-native-map-clustering';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceArea } from '../data/serviceAreas';
import { HomeScreenProps } from '../types/navigation';
import { Colors } from '../constants/Colors';
import { haversineDistance, formatDistance } from '../utils/distance';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@service_areas_cache';

const BRANDS = ['Tutti', 'Autogrill', 'Chef Express', 'Sarni'];

function BrandPin({ brand }: { brand: string }) {
  const bgColor = Colors.brand[brand] ?? Colors.brand.Default;
  return (
    <View style={[styles.pin, { backgroundColor: bgColor }]}>
      <Ionicons name="restaurant" size={18} color="#fff" />
    </View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Tutti');

  // Richiesta permesso GPS
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } else {
        setPermissionGranted(false);
      }
    })();
  }, []);

  // Fetch aree di servizio con stale-while-revalidate
  useEffect(() => {
    async function fetchServiceAreas() {
      // Step A: leggi la cache
      let hasCachedData = false;
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          // Step B: mostra subito i dati cached, rimuovi il loader bloccante
          setAreas(JSON.parse(cached) as ServiceArea[]);
          setIsLoading(false);
          hasCachedData = true;
        }
      } catch {
        // cache corrotta o inaccessibile, continua normalmente
      }

      // Step C: fetch in background da Supabase
      const { data, error } = await supabase.from('service_areas').select('*');

      if (error) {
        // Step E: se fallisce ma abbiamo la cache, non bloccare l'utente
        if (!hasCachedData) {
          Alert.alert('Errore', 'Impossibile caricare le aree di servizio.');
        }
      } else {
        // Step D: aggiorna lo stato e salva in cache
        setAreas(data as ServiceArea[]);
        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          // errore di scrittura cache non critico
        }
      }

      setIsLoading(false);
    }
    fetchServiceAreas();
  }, []);

  const filteredAreas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return areas.filter((area) => {
      const matchesName = query === '' || area.name.toLowerCase().includes(query);
      const matchesBrand = selectedBrand === 'Tutti' || area.brand === selectedBrand;
      return matchesName && matchesBrand;
    });
  }, [areas, searchQuery, selectedBrand]);

  const handleNavigation = async (area: ServiceArea) => {
    try {
      await showLocation({
        latitude: area.latitude,
        longitude: area.longitude,
        title: area.name,
        dialogTitle: 'Apri con...',
        dialogMessage: 'Scegli l\'app di navigazione',
        cancelText: 'Annulla',
      });
    } catch {
      Alert.alert(
        'Nessuna app trovata',
        'Non è stata trovata nessuna app di navigazione installata.',
        [{ text: 'OK' }]
      );
    }
  };

  if (permissionGranted === false) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTesto}>
          Permesso GPS negato. Impossibile trovare le aree di servizio vicine.
        </Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={{ flex: 1, backgroundColor: '#dde8d8' }}>
        <View style={[styles.searchContainer, { top: insets.top + 12 }]}>
          <HomeLoadingOverlay />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 2.5,
          longitudeDelta: 2.5,
        }}
        clusterColor={Colors.primary}
        clusterTextColor="#fff"
        clusterFontFamily="System"
        radius={40}
      >
        {filteredAreas.map((area) => (
          <Marker
            key={area.id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            title={area.name}
            description={area.brand}
            onPress={() => setSelectedArea(area)}
          >
            <BrandPin brand={area.brand} />
          </Marker>
        ))}
      </MapView>

      {/* Barra di ricerca + filtri brand */}
      <View style={[styles.searchContainer, { top: insets.top + 12 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca area di servizio..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {isLoading && (
            <View style={styles.loadingDot} />
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {BRANDS.map((brand) => {
            const active = brand === selectedBrand;
            return (
              <TouchableOpacity
                key={brand}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedBrand(brand)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {brand}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {selectedArea && (
        <View style={styles.pannello}>
          <TouchableOpacity style={styles.btnChiudi} onPress={() => setSelectedArea(null)}>
            <Text style={styles.btnChiudiTesto}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.pannelloNome}>{selectedArea.name}</Text>
          <Text style={styles.pannelloBrand}>{selectedArea.brand}</Text>

          {(selectedArea.highway || selectedArea.km != null) && (
            <Text style={styles.pannelloInfo}>
              {[selectedArea.highway, selectedArea.km != null ? `Km ${selectedArea.km}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}

          {selectedArea.direction && (
            <Text style={styles.pannelloDirezione}>
              Direzione: {selectedArea.direction}
            </Text>
          )}

          {location && (
            <Text style={styles.pannelloDistanza}>
              a {formatDistance(haversineDistance(
                location.coords.latitude,
                location.coords.longitude,
                selectedArea.latitude,
                selectedArea.longitude
              ))} da te
            </Text>
          )}

          <View style={styles.bottoniera}>
            <TouchableOpacity
              style={styles.btnNaviga}
              onPress={() => handleNavigation(selectedArea)}
            >
              <Text style={styles.btnTestoPrimario}>Naviga</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnRecensioni}
              onPress={() => navigation.navigate('Reviews', { area: selectedArea })}
            >
              <Text style={styles.btnTestoSecondario}>Recensioni</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackTesto: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },

  // ── Ricerca e filtri ──────────────────────────────────────────────────────
  searchContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    padding: 0,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
    opacity: 0.6,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  chipTextActive: {
    color: '#fff',
  },

  // ── Pannello dettaglio ────────────────────────────────────────────────────
  pannello: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
  },
  btnChiudi: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnChiudiTesto: {
    fontSize: 18,
    color: '#888',
  },
  pannelloNome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  pannelloBrand: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  pannelloInfo: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  pannelloDirezione: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: 4,
  },
  pannelloDistanza: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  bottoniera: {
    flexDirection: 'row',
    gap: 12,
  },
  btnNaviga: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnRecensioni: {
    flex: 1,
    backgroundColor: '#f1f3f4',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnTestoPrimario: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  btnTestoSecondario: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 15,
  },
});
