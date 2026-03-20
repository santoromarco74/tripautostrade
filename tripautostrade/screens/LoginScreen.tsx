import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isRegistrazione, setIsRegistrazione] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const gestisciSubmit = async () => {
    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed || !password) {
      Alert.alert('Campi mancanti', 'Inserisci email e password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password troppo corta', 'La password deve avere almeno 6 caratteri.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegistrazione) {
        await signUp(emailTrimmed, password);
        Alert.alert(
          'Registrazione completata',
          "Controlla la tua email per confermare l'account, poi accedi."
        );
      } else {
        await signIn(emailTrimmed, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      Alert.alert('Errore', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="car-outline" size={64} color={Colors.primary} />
          <Text style={styles.titolo}>TripAutostrade</Text>
          <Text style={styles.sottotitolo}>
            {isRegistrazione ? 'Crea un account' : 'Accedi al tuo account'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="nome@esempio.it"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimo 6 caratteri"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btnPrimario, isLoading && { opacity: 0.7 }]}
            onPress={gestisciSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimarioTesto}>
                {isRegistrazione ? 'Registrati' : 'Accedi'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.btnToggle}
          onPress={() => setIsRegistrazione((v) => !v)}
        >
          <Text style={styles.btnToggleTesto}>
            {isRegistrazione
              ? 'Hai già un account? Accedi'
              : "Non hai un account? Registrati"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  titolo: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  sottotitolo: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    marginBottom: 4,
  },
  btnPrimario: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimarioTesto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  btnToggle: {
    paddingVertical: 8,
  },
  btnToggleTesto: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
