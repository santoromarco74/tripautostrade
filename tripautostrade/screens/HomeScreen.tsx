import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { serviceAreasData, ServiceArea } from '../data/serviceAreas';
import { HomeScreenProps } from '../types/navigation';
import { Colors } from '../constants/Colors';
import { haversineDistance, formatDistance } from '../utils/distance';

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
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Tutti');

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

  const filteredAreas = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return serviceAreasData.filter((area) => {
      const matchesName = query === '' || area.name.toLowerCase().includes(query);
      const matchesBrand = selectedBrand === 'Tutti' || area.brand === selectedBrand;
      return matchesName && matchesBrand;
    });
  }, [searchQuery, selectedBrand]);

  const apriNavigazione = (area: ServiceArea) => {
    const url =
      Platform.OS === 'ios'
        ? `maps://?daddr=${area.latitude},${area.longitude}`
        : `google.navigation:q=${area.latitude},${area.longitude}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${area.latitude},${area.longitude}`);
    });
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
    return <View style={styles.fallback} />;
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
      >
        {filteredAreas.map((area) => (
          <Marker
            key={area.id}
            coordinate={{ latitude: area.latitude, longitude: area.longitude }}
            title={area.name}
            description={`${area.highway} · ${area.direction}`}
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
          <Text style={styles.pannelloInfo}>
            {selectedArea.highway} · Km {selectedArea.km}
          </Text>
          <Text style={styles.pannelloDirezione}>
            Direzione: {selectedArea.direction}
          </Text>

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
              onPress={() => apriNavigazione(selectedArea)}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnRecensioni: {
    flex: 1,
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
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
