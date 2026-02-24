import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AddReviewScreenProps } from '../types/navigation';
import { useReviews } from '../context/ReviewsContext';

export default function AddReviewScreen({ route, navigation }: AddReviewScreenProps) {
  const { area } = route.params;
  const { addReview } = useReviews();
  const [stelle, setStelle] = useState(0);
  const [commento, setCommento] = useState('');
  const [foto, setFoto] = useState<string | null>(null);

  const sceglieFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Abilita l\'accesso alla galleria nelle impostazioni.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setFoto(result.assets[0].uri);
    }
  };

  const pubblica = () => {
    if (stelle === 0) {
      Alert.alert('Valutazione mancante', 'Seleziona almeno una stella.');
      return;
    }
    if (commento.trim().length < 10) {
      Alert.alert('Commento troppo corto', 'Scrivi almeno 10 caratteri.');
      return;
    }
    const oggi = new Date();
    const data = oggi.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

    addReview({
      areaId: area.id,
      autore: 'Tu',
      stelle,
      testo: commento.trim(),
      data,
      ...(foto ? { fotoUri: foto } : {}),
    });

    Alert.alert('Recensione inviata con successo!', undefined, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerArea}>
        <Text style={styles.nomeArea}>{area.nome}</Text>
        <Text style={styles.brandArea}>{area.brand} · {area.autostrada}</Text>
      </View>

      {/* Stelle */}
      <View style={styles.sezione}>
        <Text style={styles.label}>La tua valutazione</Text>
        <View style={styles.stelleRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setStelle(n)} activeOpacity={0.7}>
              <Ionicons
                name={n <= stelle ? 'star' : 'star-outline'}
                size={40}
                color={n <= stelle ? '#f4b400' : '#ccc'}
                style={styles.stellaIcona}
              />
            </TouchableOpacity>
          ))}
        </View>
        {stelle > 0 && (
          <Text style={styles.stelleLabel}>
            {['', 'Pessimo', 'Scarso', 'Nella norma', 'Buono', 'Eccellente'][stelle]}
          </Text>
        )}
      </View>

      {/* Commento */}
      <View style={styles.sezione}>
        <Text style={styles.label}>La tua recensione</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Racconta la tua esperienza..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={5}
          value={commento}
          onChangeText={setCommento}
          textAlignVertical="top"
        />
        <Text style={styles.contatore}>{commento.length} caratteri</Text>
      </View>

      {/* Foto */}
      <View style={styles.sezione}>
        <Text style={styles.label}>Foto (opzionale)</Text>
        {foto ? (
          <View style={styles.fotoContainer}>
            <Image source={{ uri: foto }} style={styles.anteprima} />
            <TouchableOpacity style={styles.btnRimuoviFoto} onPress={() => setFoto(null)}>
              <Ionicons name="close-circle" size={28} color="#e53935" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.btnFoto} onPress={sceglieFoto}>
            <Ionicons name="image-outline" size={28} color="#1a73e8" />
            <Text style={styles.btnFotoTesto}>Aggiungi Foto</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pubblica */}
      <TouchableOpacity style={styles.btnPubblica} onPress={pubblica}>
        <Text style={styles.btnPubblicaTesto}>Pubblica</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerArea: {
    marginBottom: 24,
  },
  nomeArea: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  brandArea: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sezione: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  stelleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  stellaIcona: {
    marginRight: 2,
  },
  stelleLabel: {
    marginTop: 8,
    fontSize: 14,
    color: '#f4b400',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contatore: {
    marginTop: 6,
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
  },
  btnFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1a73e8',
    borderStyle: 'dashed',
    padding: 18,
    justifyContent: 'center',
  },
  btnFotoTesto: {
    fontSize: 15,
    color: '#1a73e8',
    fontWeight: '600',
  },
  fotoContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  anteprima: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  btnRimuoviFoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  btnPubblica: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPubblicaTesto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
