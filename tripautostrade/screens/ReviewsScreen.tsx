import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewScreenProps } from '../types/navigation';
import { useReviews, Recensione } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

function Stelle({ numero }: { numero: number }) {
  return (
    <Text style={styles.stelle}>
      {Array.from({ length: 5 }, (_, i) => (i < numero ? '★' : '☆')).join('')}
    </Text>
  );
}

function LikeButton({
  item,
  currentUserId,
  onToggle,
}: {
  item: Recensione;
  currentUserId?: string;
  onToggle: (id: string) => void;
}) {
  const isOwnReview = currentUserId != null && item.userId === currentUserId;

  if (isOwnReview) return null;

  return (
    <TouchableOpacity
      style={styles.likeRow}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.6}
    >
      <Ionicons
        name={item.likedByMe ? 'thumbs-up' : 'thumbs-up-outline'}
        size={18}
        color={item.likedByMe ? Colors.primary : '#999'}
      />
      <Text style={[styles.likeTesto, item.likedByMe && styles.likeTestoAttivo]}>
        {item.likeCount > 0 ? `${item.likeCount} Utile` : 'Utile'}
      </Text>
    </TouchableOpacity>
  );
}

export default function ReviewsScreen({ route, navigation }: ReviewScreenProps) {
  const { area } = route.params;
  const { recensioni, isLoading, toggleLike } = useReviews();
  const { user } = useAuth();

  const recensioniArea = recensioni.filter((r) => r.areaId === area.id);

  const mediaValutazione =
    recensioniArea.length > 0
      ? (recensioniArea.reduce((acc, r) => acc + r.stelle, 0) / recensioniArea.length).toFixed(1)
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.nomeArea}>{area.name}</Text>
        <Text style={styles.brandArea}>{area.brand} · {area.highway} Km {area.km}</Text>
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
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTesto}>Sii il primo a recensire quest'area!</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.autore}>{item.autore}</Text>
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
            <LikeButton item={item} currentUserId={user?.id} onToggle={toggleLike} />
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnScrivi}
          onPress={() => navigation.navigate('AddReview', { area })}
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
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTesto: {
    fontSize: 15,
    color: '#aaa',
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
  },
  autore: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1a1a1a',
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
    borderTopColor: '#f0f0f0',
  },
  likeTesto: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  likeTestoAttivo: {
    color: Colors.primary,
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
    borderRadius: 12,
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
