import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * L'app è navigabile senza account; solo le azioni che scrivono dati
 * (recensione, like, preferito, segnala servizi) richiedono login.
 *
 * Ritorna una funzione da chiamare al posto dell'azione: se l'utente è
 * loggato esegue subito e ritorna `true`; altrimenti apre Login e ritorna
 * `false` (l'azione va quindi saltata dal chiamante).
 */
export function useRequireAuth() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  return (): boolean => {
    if (user) return true;
    navigation.navigate('Login');
    return false;
  };
}
