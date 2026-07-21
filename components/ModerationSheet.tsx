import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface Props {
  visible: boolean;
  /** Nome dell'autore della recensione, mostrato nel sottotitolo */
  autore?: string;
  onSegnala: () => void;
  onBlocca: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet coerente col design system per le azioni di moderazione su una
 * recensione altrui (segnala / blocca). Sostituisce l'Alert di sistema.
 */
export function ModerationSheet({ visible, autore, onSegnala, onBlocca, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.content} activeOpacity={1}>
          <View style={styles.handle} />
          <Text style={styles.title}>Modera contenuto</Text>
          {autore ? <Text style={styles.subtitle}>Recensione di {autore}</Text> : null}

          <TouchableOpacity style={styles.row} onPress={onSegnala} activeOpacity={0.7}>
            <View style={[styles.iconWrap, { backgroundColor: '#FFF7E6' }]}>
              <Ionicons name="flag-outline" size={20} color={Colors.warning} />
            </View>
            <View style={styles.rowTesti}>
              <Text style={styles.rowTitolo}>Segnala recensione</Text>
              <Text style={styles.rowSub}>Contenuto inappropriato, spam o falso</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={onBlocca} activeOpacity={0.7}>
            <View style={[styles.iconWrap, { backgroundColor: '#FDECEC' }]}>
              <Ionicons name="ban-outline" size={20} color="#E53935" />
            </View>
            <View style={styles.rowTesti}>
              <Text style={styles.rowTitolo}>Blocca utente</Text>
              <Text style={styles.rowSub}>Non vedrai più le sue recensioni</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.annulla} onPress={onClose}>
            <Text style={styles.annullaTesto}>Annulla</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTesti: { flex: 1 },
  rowTitolo: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  annulla: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 14,
  },
  annullaTesto: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
