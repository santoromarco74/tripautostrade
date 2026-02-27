import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useReviews } from '../context/ReviewsContext';
import { Colors } from '../constants/Colors';
import { serviceAreasData } from '../data/serviceAreas';
import { ActivityScreenProps } from '../types/navigation';

interface MiaRecensione {
  id: string;
  service_area_id: string;
  rating: number;
  comment: string;
  created_at: string;
  image_url?: string;
}

export default function ActivityScreen({ navigation }: ActivityScreenProps) {
  const { user } = useAuth();
  const { deleteReview } = useReviews();
  const insets = useSafeAreaInsets();
  const [recensioni, setRecensioni] = useState<MiaRecensione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRecensioni((data ?? []) as MiaRecensione[]);
        setLoading(false);
      });
  }, [user]);

  const handleDelete = (id: string) => {
    Alert.alert('Elimina recensione', 'Vuoi davvero eliminare questa recensione?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(id);
            setRecensioni((prev) => prev.filter((r) => r.id !== id));
          } catch {
            Alert.alert('Errore', 'Impossibile eliminare la recensione.');
          }
        },
      },
    ]);
  };

  const handleEdit = (item: MiaRecensione) => {
    const area = serviceAreasData.find((a) => a.id === item.service_area_id);
    if (!area) return;
    navigation.navigate('AddReview', {
      area,
      recensioneEsistente: {
        id: item.id,
        stelle: item.rating,
        testo: item.comment,
        imageUrl: item.image_url,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centro}>
        <Ionicons name="person-outline" size={56} color="#d0d0d0" />
        <Text style={styles.titolo}>Accedi per vedere le tue recensioni</Text>
      </View>
    );
  }

  if (recensioni.length === 0) {
    return (
      <View style={styles.centro}>
        <Ionicons name="list-circle-outline" size={72} color="#d0d0d0" />
        <Text style={styles.titolo}>Nessuna recensione ancora</Text>
        <Text style={styles.sottotitolo}>Le recensioni che scrivi appariranno qui</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recensioni}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.lista, { paddingBottom: insets.bottom + 16 }]}
      ListHeaderComponent={<Text style={styles.intestazione}>Le mie recensioni</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.areaId} numberOfLines={1}>{item.service_area_id}</Text>
            <View style={styles.cardHeaderRight}>
              <View style={styles.stelleRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Ionicons
                    key={n}
                    name={n <= item.rating ? 'star' : 'star-outline'}
                    size={14}
                    color={n <= item.rating ? '#f4b400' : '#ccc'}
                  />
                ))}
              </View>
              <View style={styles.azioniRow}>
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
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
            </View>
          </View>
          <Text style={styles.commento}>{item.comment}</Text>
          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.foto} />
          )}
          <Text style={styles.data}>
            {new Date(item.created_at).toLocaleDateString('it-IT', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  titolo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  sottotitolo: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  lista: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  intestazione: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  areaId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    flex: 1,
    marginRight: 8,
  },
  stelleRow: {
    flexDirection: 'row',
    gap: 2,
  },
  azioniRow: {
    flexDirection: 'row',
    gap: 10,
  },
  commento: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 8,
  },
  foto: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  data: {
    fontSize: 12,
    color: '#aaa',
  },
});
