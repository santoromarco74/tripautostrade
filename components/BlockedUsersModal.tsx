import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';
import { useReviews } from '../context/ReviewsContext';

interface BlockedUser {
  id: string;
  nome: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function BlockedUsersModal({ visible, onClose }: Props) {
  const { unblockUser } = useReviews();
  const [lista, setLista] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let attivo = true;
    (async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: blocks } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', user.id);
        const ids = (blocks ?? []).map((b) => b.blocked_id);
        if (ids.length === 0) {
          if (attivo) setLista([]);
          return;
        }
        const { data: profili } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ids);
        if (attivo) {
          setLista(
            ids.map((id) => ({
              id,
              nome:
                profili?.find((p) => p.id === id)?.full_name || 'Utente',
            })),
          );
        }
      } finally {
        if (attivo) setLoading(false);
      }
    })();
    return () => { attivo = false; };
  }, [visible]);

  const sblocca = async (id: string) => {
    try {
      await unblockUser(id);
      setLista((l) => l.filter((u) => u.id !== id));
    } catch {
      // silenzioso: l'utente può riprovare
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Utenti bloccati</Text>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
          ) : lista.length === 0 ? (
            <Text style={styles.empty}>Non hai bloccato nessun utente.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 360 }}>
              {lista.map((u) => (
                <View key={u.id} style={styles.row}>
                  <Text style={styles.nome} numberOfLines={1}>{u.nome}</Text>
                  <TouchableOpacity style={styles.btnSblocca} onPress={() => sblocca(u.id)}>
                    <Text style={styles.btnSbloccaTesto}>Sblocca</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.chiudi} onPress={onClose}>
            <Text style={styles.chiudiTesto}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  content: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  empty: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nome: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  btnSblocca: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  btnSbloccaTesto: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  chiudi: {
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  chiudiTesto: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
