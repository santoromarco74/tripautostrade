import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewScreenProps } from '../types/navigation';
import { useReviews } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { CardSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';

function Stelle({ numero }: { numero: number }) {
  return (
    <Text style={styles.stelle}>
      {Array.from({ length: 5 }, (_, i) => (i < numero ? '★' : '☆')).join('')}
    </Text>
  );
}

export default function ReviewsScreen({ route, navigation }: ReviewScreenProps) {
  const { area } = route.params;
  const { recensioni, isLoading, deleteReview } = useReviews();
  const { user } = useAuth();

  const recensioniArea = recensioni.filter((r) => r.areaId === String(area.id));

  const mediaValutazione =
    recensioniArea.length > 0
      ? (recensioniArea.reduce((acc, r) => acc + r.stelle, 0) / recensioniArea.length).toFixed(1)
      : null;

  const handleDelete = (id: string) => {
    Alert.alert('Elimina recensione', 'Vuoi davvero eliminare questa recensione?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(id);
          } catch {
            Alert.alert('Errore', 'Impossibile eliminare la recensione.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.nomeArea}>{area.name}</Text>
        <Text style={styles.brandArea}>
          {area.brand}
          {area.highway ? ` · ${area.highway}` : ''}
          {area.km != null ? ` Km ${area.km}` : ''}
        </Text>
        {mediaValutazione ? (
          <View style={styles.mediaRow}>
            <Text style={styles.mediaNumero}>{mediaValutazione}</Text>
            <Stelle numero={Math.round(Number(mediaValutazione))} />
            <Text style={styles.mediaContegg}>({recensioniArea.length} recensioni)</Text>
          </View>
        ) : (
          <Text style={styles.nessunaRecensione}>Nessuna recensione ancora</Text>
        )}
      </View>

      <FlatList
        data={recensioniArea}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: 8 }}>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </View>
          ) : (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Nessuna recensione ancora"
              subtitle="Sii il primo a condividere la tua esperienza qui!"
            />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.autore}>{item.autore}</Text>
              <View style={styles.cardHeaderRight}>
                <Text style={styles.data}>{item.data}</Text>
                {user && item.userId === user.id && (
                  <View style={styles.azioniRow}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('AddReview', {
                          area,
                          recensioneEsistente: {
                            id: item.id,
                            stelle: item.stelle,
                            testo: item.testo,
                            imageUrl: item.imageUrl,
                          },
                        })
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                    >
                      <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
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
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnScrivi}
          onPress={() => navigation.navigate('AddReview', { area })}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnScriviTesto}>Scrivi una recensione</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  nomeArea: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  brandArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaNumero: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  stelle: {
    fontSize: 18,
    color: '#f4b400',
  },
  mediaContegg: {
    fontSize: 14,
    color: '#888',
  },
  nessunaRecensione: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },
  lista: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  azioniRow: {
    flexDirection: 'row',
    gap: 10,
  },
  autore: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1a1a1a',
    flex: 1,
  },
  data: {
    fontSize: 12,
    color: '#aaa',
  },
  testo: {
    marginTop: 8,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  cardImmagine: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  btnScrivi: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnScriviTesto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
