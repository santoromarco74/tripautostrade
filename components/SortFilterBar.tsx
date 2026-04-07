import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';

export type SortOption = 'recent' | 'highest' | 'lowest' | 'most_helpful';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Piu recenti' },
  { value: 'highest', label: 'Piu votate' },
  { value: 'lowest', label: 'Meno votate' },
  { value: 'most_helpful', label: 'Piu utili' },
];

interface SortFilterBarProps {
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function SortFilterBar({ activeSort, onSortChange }: SortFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map(({ value, label }) => {
        const active = activeSort === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSortChange(value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
});
