import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReviewScreenProps } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

interface Recensione {
  id: string;
  autore: string;
  stelle: number;
  testo: string;
  data: string;
}

const RECENSIONI_MOCK: Recensione[] = [
  {
    id: '1',
    autore: 'Marco R.',
    stelle: 5,
    testo: 'Ottimo bar, caffè eccellente e personale gentile. Bagni puliti.',
    data: '12 feb 2026',
  },
  {
    id: '2',
    autore: 'Laura M.',
    stelle: 3,
    testo: 'Nella norma per un autogrill. Code alla cassa abbastanza lunghe.',
    data: '5 feb 2026',
  },
  {
    id: '3',
    autore: 'Giorgio P.',
    stelle: 4,
    testo: 'Buona selezione di panini e tavoli disponibili. Prezzi ok.',
    data: '28 gen 2026',
  },
  {
    id: '4',
    autore: 'Silvia T.',
    stelle: 2,
    testo: 'Parcheggio sovraffollato, lunga attesa al banco.',
    data: '20 gen 2026',
  },
];

function Stelle({ numero }: { numero: number }) {
  return (
    <Text style={styles.stelle}>
      {Array.from({ length: 5 }, (_, i) => (i < numero ? '★' : '☆')).join('')}
    </Text>
  );
}

export default function ReviewsScreen({ route, navigation }: ReviewScreenProps) {
  const { area } = route.params;

  const mediaValutazione = (
    RECENSIONI_MOCK.reduce((acc, r) => acc + r.stelle, 0) / RECENSIONI_MOCK.length
  ).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.nomeArea}>{area.nome}</Text>
        <Text style={styles.brandArea}>{area.brand} · {area.autostrada}</Text>
        <View style={styles.mediaRow}>
          <Text style={styles.mediaNumero}>{mediaValutazione}</Text>
          <Stelle numero={Math.round(Number(mediaValutazione))} />
          <Text style={styles.mediaContegg}>({RECENSIONI_MOCK.length} recensioni)</Text>
        </View>
      </View>

      <FlatList
        data={RECENSIONI_MOCK}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.autore}>{item.autore}</Text>
              <Text style={styles.data}>{item.data}</Text>
            </View>
            <Stelle numero={item.stelle} />
            <Text style={styles.testo}>{item.testo}</Text>
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
  lista: {
    padding: 16,
    gap: 12,
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
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  btnScrivi: {
    backgroundColor: '#1a73e8',
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
