import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { supabase } from '../lib/supabase';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Contenuto offensivo' },
  { value: 'fake', label: 'Recensione falsa' },
  { value: 'other', label: 'Altro' },
] as const;

interface ReportModalProps {
  visible: boolean;
  reviewId: string | null;
  onClose: () => void;
}

export function ReportModal({ visible, reviewId, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setSelectedReason(null);
    setDetails('');
    setSending(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason || !reviewId) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const { error } = await supabase.from('review_reports').insert({
        review_id: reviewId,
        reporter_id: user.id,
        reason: selectedReason,
        details: details.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Gia segnalata', 'Hai gia segnalato questa recensione.');
        } else {
          throw error;
        }
      } else {
        Alert.alert(
          'Segnalazione inviata',
          'Grazie per la tua segnalazione. La esamineremo al piu presto.',
        );
      }
      handleClose();
    } catch {
      Alert.alert('Errore', 'Impossibile inviare la segnalazione. Riprova.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Segnala recensione</Text>
          <Text style={styles.subtitle}>Perche vuoi segnalare questa recensione?</Text>

          {REASONS.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[styles.reasonRow, selectedReason === value && styles.reasonRowActive]}
              onPress={() => setSelectedReason(value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={selectedReason === value ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selectedReason === value ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.reasonLabel, selectedReason === value && styles.reasonLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={styles.detailsInput}
            placeholder="Dettagli aggiuntivi (opzionale)"
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={3}
            value={details}
            onChangeText={setDetails}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Invia segnalazione</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Annulla</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  reasonRowActive: {
    backgroundColor: '#EEF9F7',
  },
  reasonLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  reasonLabelActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
  detailsInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
