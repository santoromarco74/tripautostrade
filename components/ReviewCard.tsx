import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Recensione } from '../context/ReviewsContext';

interface ReviewCardProps {
  item: Recensione;
  /** Mostra autore + data in cima alla card */
  showAuthor?: boolean;
  /** ID utente corrente, usato per capire se la recensione è propria */
  currentUserId?: string;
  /** Callback per il like — riceve l'id della recensione */
  onToggleLike: (id: string) => void;
  /** Se fornito, appare l'icona cestino in alto a destra */
  onDelete?: (id: string) => void;
  /** Se fornito (e recensione propria), appare l'icona matita */
  onEdit?: () => void;
}

export function ReviewCard({
  item,
  showAuthor = false,
  currentUserId,
  onToggleLike,
  onDelete,
  onEdit,
}: ReviewCardProps) {
  const isOwnReview = currentUserId != null && item.userId === currentUserId;

  return (
    <View style={styles.card}>

      {/* Cestino in alto a destra (assoluto) */}
      {onDelete && (
        <TouchableOpacity
          style={styles.btnElimina}
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#E53935" />
        </TouchableOpacity>
      )}

      {/* Header autore + data */}
      {showAuthor && (
        <View style={styles.header}>
          <Text style={styles.autore} numberOfLines={1}>{item.autore}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.data}>{item.data}</Text>
            {onEdit && isOwnReview && (
              <TouchableOpacity
                onPress={onEdit}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Stelle */}
      <Text style={[styles.stelle, onDelete && styles.stelleConTrash]}>
        {'★'.repeat(item.stelle)}{'☆'.repeat(5 - item.stelle)}
      </Text>

      {/* Testo recensione */}
      <Text style={styles.testo}>{item.testo}</Text>

      {/* Foto */}
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.immagine}
          resizeMode="cover"
        />
      )}

      {/* Divisore + like */}
      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.likeRow}
        onPress={() => onToggleLike(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.likedByMe ? 'heart' : 'heart-outline'}
          size={20}
          color={item.likedByMe ? '#E53935' : '#94A3B8'}
        />
        <Text style={[styles.likeCount, item.likedByMe && styles.likeCountAttivo]}>
          {item.likeCount > 0 ? item.likeCount : 'Mi piace'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  btnElimina: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
    zIndex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  autore: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  data: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  stelle: {
    fontSize: 18,
    color: Colors.accent,
    marginBottom: 8,
  },
  stelleConTrash: {
    marginRight: 32, // evita sovrapposizione col cestino
  },

  testo: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },

  immagine: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 12,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 12,
    marginBottom: 10,
  },

  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  likeCount: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  likeCountAttivo: {
    color: '#E53935',
  },
});
