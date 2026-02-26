import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { serviceAreasData } from '../data/serviceAreas';
import { Colors } from '../constants/Colors';

function Stelle({ numero }: { numero: number }) {
  return (
    <Text style={styles.stelle}>
      {Array.from({ length: 5 }, (_, i) => (i < numero ? '★' : '☆')).join('')}
    </Text>
  );
}

const areaMap = Object.fromEntries(serviceAreasData.map((a) => [a.id, a]));

export default function ActivityScreen() {
  const { recensioni, isLoading } = useReviews();
  const { user } = useAuth();

  const mieRecensioni = recensioni.filter((r) => r.userId === user?.id);

  if (isLoading) {
    return (
      <View style={styles.centrato}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitolo}>Le mie recensioni</Text>
        <Text style={styles.headerConteggio}>
          {mieRecensioni.length} {mieRecensioni.length === 1 ? 'recensione' : 'recensioni'}
        </Text>
      </View>

      <FlatList
        data={mieRecensioni}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitolo}>Nessuna recensione ancora</Text>
            <Text style={styles.emptySottotitolo}>
              Le recensioni che scrivi appariranno qui
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const area = areaMap[item.areaId];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.areaName} numberOfLines={1}>
                    {area?.name ?? item.areaId}
                  </Text>
                  {area && (
                    <Text style={styles.areaBrand}>
                      {area.brand} · {area.highway} Km {area.km}
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
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centrato: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitolo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerConteggio: {
    fontSize: 13,
    color: '#888',
  },
  lista: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitolo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  emptySottotitolo: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1a1a1a',
  },
  areaBrand: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  data: {
    fontSize: 12,
    color: '#aaa',
    flexShrink: 0,
  },
  stelle: {
    fontSize: 16,
    color: '#f4b400',
    marginVertical: 4,
  },
  testo: {
    marginTop: 6,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  cardImmagine: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 10,
  },
});
