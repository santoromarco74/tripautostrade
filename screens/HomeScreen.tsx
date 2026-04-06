import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HomeLoadingOverlay } from '../components/SkeletonLoader';
import * as Location from 'expo-location';
import MapView from 'react-native-map-clustering';
import { Marker } from 'react-native-maps';
import type RNMapView from 'react-native-maps';
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

const SERVICE_FILTERS: { key: keyof ServiceArea; label: string }[] = [
  { key: 'has_restaurant', label: '🍝 Ristorante' },
  { key: 'has_cafe',       label: '☕ Bar' },
  { key: 'has_wifi',       label: '📶 Wi-Fi' },
  { key: 'pet_friendly',   label: '🐕 Pet' },
  { key: 'has_showers',    label: '🚿 Docce' },
  { key: 'ev_charging',    label: '⚡ EV' },
];

const BRAND_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Autogrill: 'restaurant',
  'Chef Express': 'cafe',
  Sarni: 'fast-food',
};


export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Tutti');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const mapRef = useRef<RNMapView>(null);

  // Intercetta il tasto Back su Android solo su questa schermata
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Uscita',
          "Vuoi davvero uscire dall'app?",
          [
            { text: 'Annulla', style: 'cancel' },
            { text: 'Esci', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]
        );
        return true; // blocca l'uscita immediata
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

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
      const matchesService = activeFilter === null || area[activeFilter as keyof ServiceArea] === true;
      return matchesName && matchesBrand && matchesService;
    });
  }, [areas, searchQuery, selectedBrand, activeFilter]);

  const handleNavigation = async (area: ServiceArea) => {
    const { latitude: lat, longitude: lng } = area;

    if (Platform.OS === 'android') {
      // Universal Link ufficiale Google Maps: apre l'anteprima percorso
      // (tempo, km, percorso sulla mappa) prima di premere Avvia.
      // SENZA dir_action=navigate, altrimenti salterebbe l'anteprima.
      const googlePreview = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      await Linking.openURL(googlePreview);
    } else {
      // iOS: prova Google Maps app (mostra anteprima), poi Apple Maps
      const googleMaps = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
      const appleMaps = `maps://?daddr=${lat},${lng}&dirflg=d`;

      if (await Linking.canOpenURL(googleMaps)) {
        await Linking.openURL(googleMaps);
      } else {
        await Linking.openURL(appleMaps);
      }
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
        <View style={[styles.searchContainer, { top: (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top) + 12 }]}>
          <HomeLoadingOverlay />
        </View>
      </View>
    );
  }

  const selezionaArea = (area: ServiceArea) => {
    setSelectedArea(area);
    setSearchQuery('');
    Keyboard.dismiss();
    mapRef.current?.animateToRegion(
      {
        latitude: area.latitude,
        longitude: area.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      1000,
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
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
            // IL TRUCCO DEFINITIVO: Aggiungi lo stato "selezionato" alla chiave!
            // Quando selectedArea cambia, la chiave cambia, forzando Android a ricalcolare
            // le dimensioni del pin selezionato da zero, senza tagliarlo.
            key={`${area.id}-${activeFilter || 'all'}-${selectedArea?.id === area.id ? 'sel' : 'unsel'}`}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            title={area.name}
            description={area.brand}
            onPress={() => selezionaArea(area)}
            // tracksViewChanges= RIMOSSO. Lascia che Android tracci il cambiamento
            // mentre ricalcola la dimensione del pin selezionato.
          >
            {/* Struttura semplificata, un solo View circolare direttamente */}
            <View style={[
              styles.pin,
              selectedArea?.id === area.id && styles.pinSelezionato,
            ]}>
              <Ionicons
                name={BRAND_ICON[area.brand] ?? 'restaurant'}
                size={selectedArea?.id === area.id ? 20 : 16}
                color="#fff"
              />
            </View>
          </Marker>
        ))}
        {isLoading && <HomeLoadingOverlay />}
      </MapView>

      {/* Barra di ricerca + filtri brand */}
      <View style={[styles.searchContainer, { top: insets.top + 12 }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={searchFocused ? Colors.primary : '#94A3B8'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cerca area di servizio..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={(t) => { setSearchQuery(t); }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {isLoading && <View style={styles.loadingDot} />}
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dropdown risultati ricerca */}
        {searchQuery.trim().length > 0 && (
          <FlatList
            data={filteredAreas.slice(0, 6)}
            keyExtractor={(item) => String(item.id)}
            style={styles.dropdown}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => selezionaArea(item)}
              >
                <Ionicons name="location-outline" size={16} color={Colors.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dropdownNome} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.dropdownSub}>{item.brand}{item.highway ? ` · ${item.highway}` : ''}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.dropdownVuoto}>
                <Text style={styles.dropdownVuotoTesto}>Nessuna area trovata</Text>
              </View>
            }
          />
        )}

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

        {/* Filtri rapidi per servizi */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {SERVICE_FILTERS.map(({ key, label }) => {
            const active = activeFilter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.chip, active && styles.chipServiceActive]}
                onPress={() => setActiveFilter(active ? null : key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {label}
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

          <TouchableOpacity onPress={() => navigation.navigate('ServiceArea', { area: selectedArea })}>
            <Text style={[styles.pannelloNome, styles.pannelloNomeLink]}>{selectedArea.name}</Text>
          </TouchableOpacity>
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
  // pinWrapper RIMOSSO (non serve più)

  pin: {
    // Dimensioni fisse per Android
    width: 36,
    height: 36,
    borderRadius: 18, // Metà esatta di 36
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    
    // Ombra più decisa per Android (elevation) e iOS
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pinSelezionato: {
    // Dimensioni fisse e più grandi per il pin selezionato
    width: 48,
    height: 48,
    borderRadius: 24, // Metà esatta di 48
    backgroundColor: Colors.accent,
    borderWidth: 3,
    elevation: 10, // Più elevation per farlo "risaltare"
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
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipServiceActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
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
    color: Colors.text,
    marginBottom: 4,
  },
  pannelloNomeLink: {
    textDecorationLine: 'underline',
    color: Colors.primary,
  },
  pannelloBrand: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  pannelloInfo: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  pannelloDirezione: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  pannelloDistanza: {
    fontSize: 13,
    color: Colors.textSecondary,
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

  // ── Dropdown ricerca ─────────────────────────────────────────────────────
  dropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginTop: 4,
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownNome: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dropdownSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dropdownVuoto: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownVuotoTesto: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
