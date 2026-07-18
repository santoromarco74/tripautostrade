import { useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewScreenProps } from '../types/navigation';
import { useReviews, Recensione } from '../context/ReviewsContext';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';
import { CardSkeleton } from '../components/SkeletonLoader';
import { EmptyState } from '../components/EmptyState';
import { ReportModal } from '../components/ReportModal';
import { SortFilterBar, SortOption } from '../components/SortFilterBar';

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
  const { recensioni, isLoading, toggleLike, deleteReview, blockUser } = useReviews();
  const { user } = useAuth();
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  // Flag su recensione altrui → segnala o blocca l'autore
  const moderaContenuto = (item: Recensione) => {
    Alert.alert(
      'Modera contenuto',
      `Recensione di ${item.autore}`,
      [
        { text: 'Segnala recensione', onPress: () => setReportingReviewId(item.id) },
        {
          text: 'Blocca utente',
          style: 'destructive',
          onPress: () => {
            if (!item.userId) return;
            Alert.alert(
              'Blocca utente',
              `Non vedrai più le recensioni di ${item.autore}. Puoi sbloccarlo in seguito dal tuo profilo.`,
              [
                { text: 'Annulla', style: 'cancel' },
                {
                  text: 'Blocca',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await blockUser(item.userId!);
                    } catch {
                      Alert.alert('Errore', 'Impossibile bloccare l\'utente. Riprova.');
                    }
                  },
                },
              ]
            );
          },
        },
        { text: 'Annulla', style: 'cancel' },
      ]
    );
  };

  const recensioniArea = recensioni.filter((r) => r.areaId === String(area.id));

  const sortedRecensioni = useMemo(() => {
    const sorted = [...recensioniArea];
    switch (sortOption) {
      case 'highest':
        return sorted.sort((a, b) => b.stelle - a.stelle || b.data.localeCompare(a.data));
      case 'lowest':
        return sorted.sort((a, b) => a.stelle - b.stelle || b.data.localeCompare(a.data));
      case 'most_helpful':
        return sorted.sort((a, b) => b.likeCount - a.likeCount || b.stelle - a.stelle);
      default:
        return sorted; // gia ordinati per data desc dal context
    }
  }, [recensioniArea, sortOption]);

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

      {recensioniArea.length > 1 && (
        <SortFilterBar activeSort={sortOption} onSortChange={setSortOption} />
      )}

      <FlatList
        data={sortedRecensioni}
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
                            pagelle: item.pagelle,
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
            <View style={styles.cardFooter}>
              <LikeButton item={item} currentUserId={user?.id} onToggle={toggleLike} />
              {user && item.userId !== user.id && (
                <TouchableOpacity
                  onPress={() => moderaContenuto(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="flag-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <ReportModal
        visible={reportingReviewId !== null}
        reviewId={reportingReviewId}
        onClose={() => setReportingReviewId(null)}
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
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nomeArea: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  brandArea: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.accent,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
