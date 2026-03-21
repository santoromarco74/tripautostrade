import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

function SkeletonRect({
  height,
  width,
  borderRadius = 8,
  style,
}: {
  height: number;
  width?: number | `${number}%`;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
      ])
    ).start();
    return () => opacity.stopAnimation();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: '#c8c8c8', borderRadius, height, width, opacity }, style]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonRect height={13} borderRadius={7} style={{ flex: 1 }} />
        <SkeletonRect height={11} width={60} borderRadius={6} />
      </View>
      <SkeletonRect height={11} width="40%" borderRadius={6} style={{ marginTop: 8 }} />
      <SkeletonRect height={13} borderRadius={7} style={{ marginTop: 12 }} />
      <SkeletonRect height={13} width="80%" borderRadius={7} style={{ marginTop: 6 }} />
    </View>
  );
}

export function HomeLoadingOverlay() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    return () => opacity.stopAnimation();
  }, [opacity]);

  return (
    <View style={styles.homeOverlay}>
      <Animated.View style={[styles.searchBarSkeleton, { opacity }]} />
      <View style={styles.chipsRow}>
        {[72, 88, 80, 72].map((w, i) => (
          <Animated.View key={i} style={[styles.chipSkeleton, { width: w, opacity }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  homeOverlay: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  searchBarSkeleton: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#d0d0d0',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipSkeleton: {
    height: 34,
    borderRadius: 20,
    backgroundColor: '#d0d0d0',
  },
});
