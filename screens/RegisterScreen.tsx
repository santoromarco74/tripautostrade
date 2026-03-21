import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';
import { AuthStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campi mancanti', 'Inserisci email e password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password troppo corta', 'La password deve avere almeno 6 caratteri.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      Alert.alert('Errore registrazione', error.message);
    } else {
      Alert.alert(
        'Registrazione completata',
        'Controlla la tua email per confermare l\'account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.titolo}>Crea account</Text>
        <Text style={styles.sottotitolo}>Registrati per scrivere recensioni</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min. 6 caratteri)"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.btnPrimario, loading && styles.btnDisabilitato]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.btnTestoPrimario}>{loading ? 'Registrazione...' : 'Registrati'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkAccedi}>Hai già un account? <Text style={styles.linkAccento}>Accedi</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  titolo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sottotitolo: {
    fontSize: 16,
    color: '#888',
    marginBottom: 36,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 14,
    backgroundColor: '#fafafa',
  },
  btnPrimario: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  btnDisabilitato: {
    opacity: 0.6,
  },
  btnTestoPrimario: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkAccedi: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
  },
  linkAccento: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
