import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { ServiceArea } from '../data/serviceAreas';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { SegmentedControl } from '../components/SegmentedControl';
import { EmptyState } from '../components/EmptyState';
import { ActivityScreenProps } from '../types/navigation';
import * as Location from 'expo-location';
import { haversineDistance, formatDistance } from '../utils/distance';
import { calcolaTitolo } from '../utils/livelli';

interface ProfiloClassifica {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
}

function Stelle({ numero }: { numero: number }) {
  return (
    <Text style={styles.stelle}>
      {Array.from({ length: 5 }, (_, i) => (i < numero ? '\u2605' : '\u2606')).join('')}
    </Text>
  );
}

export default function ActivityScreen({ navigation }: ActivityScreenProps) {
  const { recensioni, isLoading } = useReviews();
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState(0);
  const [areaMap, setAreaMap] = useState<Record<string, ServiceArea>>({});
  const [allAreas, setAllAreas] = useState<ServiceArea[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [classifica, setClassifica] = useState<ProfiloClassifica[] | null>(null);

  // Carica la classifica quando si apre la tab (e la ricarica ad ogni rientro)
  useEffect(() => {
    if (activeTab !== 2) return;
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, points')
      .order('points', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setClassifica(data as ProfiloClassifica[]);
      });
  }, [activeTab]);

  useEffect(() => {
    supabase.from('service_areas').select('*').then(({ data }) => {
      if (data) {
        const areas = data as ServiceArea[];
        setAllAreas(areas);
        const map: Record<string, ServiceArea> = {};
        for (const a of areas) map[String(a.id)] = a;
        setAreaMap(map);
      }
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const mieRecensioni = recensioni.filter((r) => r.userId === user?.id);

  const favoriteAreas = allAreas.filter((a) => isFavorite(a.id));

  if (isLoading) {
    return (
      <View style={styles.centrato}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.centro}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitolo}>Attivita</Text>
      </View>

      <View style={styles.segmentContainer}>
        <SegmentedControl
          segments={['Preferiti', 'Le mie recensioni', 'Classifica']}
          activeIndex={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {activeTab === 0 ? (
        /* ── TAB PREFERITI ── */
        <FlatList
          data={favoriteAreas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            user ? (
              <EmptyState
                icon="bookmark-outline"
                title="Nessun preferito"
                subtitle="Salva le aree di servizio che ti interessano dalla mappa o dalla scheda area"
              />
            ) : (
              <EmptyState
                icon="log-in-outline"
                title="Accedi per salvare i preferiti"
                subtitle="Vai sulla tab Profilo per accedere o creare un account"
              />
            )
          }
          renderItem={({ item }) => {
            const distance = userLocation
              ? haversineDistance(userLocation.lat, userLocation.lng, item.latitude, item.longitude)
              : null;

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ServiceArea', { area: item })}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleGroup}>
                    <Text style={styles.areaName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.areaBrand}>
                      {item.brand}
                      {item.highway ? ` \u00B7 ${item.highway}` : ''}
                      {item.km != null ? ` Km ${item.km}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="bookmark" size={22} color={Colors.accent} />
                  </TouchableOpacity>
                </View>
                {distance !== null && (
                  <View style={styles.distanceRow}>
                    <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.distanceText}>a {formatDistance(distance)} da te</Text>
                  </View>
                )}
                <View style={styles.favActions}>
                  <TouchableOpacity
                    style={styles.btnNaviga}
                    onPress={() => navigation.navigate('ServiceArea', { area: item })}
                  >
                    <Ionicons name="arrow-forward-outline" size={16} color={Colors.primary} />
                    <Text style={styles.btnNavigaText}>Vai alla scheda</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : activeTab === 1 ? (
        /* ── TAB LE MIE RECENSIONI ── */
        <FlatList
          data={mieRecensioni}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            mieRecensioni.length > 0 ? (
              <Text style={styles.subConteggio}>
                {mieRecensioni.length} {mieRecensioni.length === 1 ? 'recensione' : 'recensioni'}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-outline"
              title="Nessuna recensione ancora"
              subtitle="Le recensioni che scrivi appariranno qui"
            />
          }
          renderItem={({ item }) => {
            const area = areaMap[String(item.areaId)];
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleGroup}>
                    <Text style={styles.areaName} numberOfLines={1}>
                      {area?.name ?? item.areaId}
                    </Text>
                    {area && (
                      <Text style={styles.areaBrand}>
                        {area.brand} \u00B7 {area.highway} Km {area.km}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.data}>{item.data}</Text>
                </View>
                <Stelle numero={item.stelle} />
                <Text style={styles.testo}>{item.testo}</Text>
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.cardImmagine}
                    resizeMode="cover"
                  />
                )}
                {item.likeCount > 0 && (
                  <View style={styles.likeInfo}>
                    <Ionicons name="thumbs-up" size={14} color="#999" />
                    <Text style={styles.likeInfoTesto}>
                      {item.likeCount} {item.likeCount === 1 ? 'persona' : 'persone'} ha trovato utile questa recensione
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        /* ── TAB CLASSIFICA ── */
        <FlatList
          data={classifica ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            classifica && classifica.length > 0 ? (
              <Text style={styles.subConteggio}>I 20 viaggiatori con più punti</Text>
            ) : null
          }
          ListEmptyComponent={
            classifica === null ? (
              <View style={styles.centrato}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <EmptyState
                icon="trophy-outline"
                title="Classifica vuota"
                subtitle="Scrivi recensioni e ricevi like per guadagnare punti"
              />
            )
          }
          renderItem={({ item, index }) => {
            const livello = calcolaTitolo(item.points);
            const isMe = item.id === user?.id;
            const medaglie = ['🥇', '🥈', '🥉'];
            return (
              <View style={[styles.rankCard, isMe && styles.rankCardMe]}>
                <Text style={styles.rankPos}>
                  {index < 3 ? medaglie[index] : `${index + 1}`}
                </Text>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.rankAvatar} />
                ) : (
                  <View style={styles.rankAvatarPlaceholder}>
                    <Text style={styles.rankAvatarIniziale}>
                      {(item.full_name ?? 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rankNome} numberOfLines={1}>
                    {item.full_name ?? 'Utente Autostradale'}{isMe ? ' (tu)' : ''}
                  </Text>
                  <Text style={styles.rankLivello} numberOfLines={1}>
                    {livello.emoji} {livello.titolo}
                  </Text>
                </View>
                <Text style={styles.rankPunti}>{item.points} pt</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centrato: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitolo: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  subConteggio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  lista: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  cardTitleGroup: {
    flex: 1,
  },
  areaName: {
    fontWeight: '700',
    fontSize: 14,
    color: Colors.text,
  },
  areaBrand: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  data: {
    fontSize: 12,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  stelle: {
    fontSize: 16,
    color: Colors.accent,
    marginVertical: 4,
  },
  testo: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  cardImmagine: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 10,
  },
  likeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  likeInfoTesto: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  favActions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnNaviga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnNavigaText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Classifica ────────────────────────────────────────────────────────────
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rankCardMe: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },
  rankPos: {
    width: 34,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatarIniziale: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  rankNome: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  rankLivello: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  rankPunti: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
});
