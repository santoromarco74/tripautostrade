import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P   = '#004F45';
const PC  = '#00695C';
const A   = '#FDC003';
const AD  = '#785900';
const MAX = 280;

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

export default function CreatePostScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const remaining = MAX - text.length;
  const overLimit  = text.length > MAX * 0.9;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={24} color={P} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuovo Post</Text>
        <TouchableOpacity
          style={styles.postBtn}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.postBtnText}>Pubblica</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── AUTHOR ROW ──────────────────────────────────────────────────── */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={26} color="#A0F2E1" />
          </View>
          <View>
            <Text style={styles.authorName}>Viaggiatore</Text>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={12} color={AD} />
              <Text style={styles.locationText}>A1 Autostrada del Sole</Text>
            </View>
          </View>
        </View>

        {/* ── MEDIA TOOLBAR ───────────────────────────────────────────────── */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.8}>
            <MaterialIcons name="add-photo-alternate" size={20} color={P} />
            <Text style={styles.toolbarBtnText}>Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarBtn} activeOpacity={0.8}>
            <MaterialIcons name="videocam" size={20} color={P} />
            <Text style={styles.toolbarBtnText}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* ── TEXT EDITOR ─────────────────────────────────────────────────── */}
        <View style={styles.editorSurface}>
          <TextInput
            style={styles.textInput}
            placeholder="Cosa sta succedendo in autostrada?"
            placeholderTextColor="#BEC9C5"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX}
          />
          {/* Char counter badge */}
          <View style={styles.counterArea}>
            <View style={[styles.counterBadge, overLimit && styles.counterBadgeWarn]}>
              <Text style={[styles.counterText, overLimit && { color: '#E21937' }]}>
                {remaining}
              </Text>
            </View>
          </View>
        </View>

        {/* ── BENTO PREVIEW GRID ──────────────────────────────────────────── */}
        <View style={styles.previewGrid}>
          {/* Main visual */}
          <View style={[styles.previewMain]}>
            <MaterialIcons name="add-a-photo" size={28} color="#BEC9C5" />
            <Text style={styles.previewLabel}>IMMAGINE PRINCIPALE</Text>
          </View>
          {/* Side tiles */}
          <View style={styles.previewSide}>
            <View style={styles.previewSmall}>
              <MaterialIcons name="label" size={20} color={AD} style={{ opacity: 0.4 }} />
            </View>
            <View style={styles.previewSmall}>
              <MaterialIcons name="alternate-email" size={20} color="#004290" style={{ opacity: 0.4 }} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.96)', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F4F8',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0D3E37' },
  postBtn: {
    backgroundColor: P, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999,
  },
  postBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  content: { padding: 20, gap: 20, paddingBottom: 40 },

  // ── Author row ────────────────────────────────────────────────────────────
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: PC, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(0,79,69,0.1)',
  },
  authorName:   { fontSize: 15, fontWeight: '700', color: '#141C25' },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  locationText: {
    fontSize: 10, fontWeight: '600', color: '#6E7976',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // ── Toolbar ───────────────────────────────────────────────────────────────
  toolbar:       { flexDirection: 'row', gap: 10 },
  toolbarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#ECF4FF', borderRadius: 999,
  },
  toolbarBtnText: { fontSize: 13, fontWeight: '700', color: P },

  // ── Editor ────────────────────────────────────────────────────────────────
  editorSurface: {
    backgroundColor: '#FAFCFF', borderRadius: 20, padding: 20, minHeight: 200,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
  },
  textInput: {
    fontSize: 17, color: '#141C25', minHeight: 120, textAlignVertical: 'top', lineHeight: 26,
  },
  counterArea:       { alignItems: 'flex-end', marginTop: 12 },
  counterBadge: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E6EFFA', borderWidth: 2, borderColor: '#FDC003',
    alignItems: 'center', justifyContent: 'center',
  },
  counterBadgeWarn: { borderColor: '#E21937' },
  counterText: { fontSize: 11, fontWeight: '700', color: '#3E4946' },

  // ── Preview grid ──────────────────────────────────────────────────────────
  previewGrid: { flexDirection: 'row', gap: 10, height: 160 },
  previewMain: {
    flex: 2, backgroundColor: '#ECF4FF', borderRadius: 16,
    borderWidth: 1, borderColor: '#BEC9C5',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  previewLabel: { fontSize: 9, fontWeight: '800', color: '#BEC9C5', letterSpacing: 1.2 },
  previewSide:  { flex: 1, gap: 10 },
  previewSmall: {
    flex: 1, backgroundColor: '#F7F9FF', borderRadius: 12,
    borderWidth: 1, borderColor: '#DAE3EF',
    alignItems: 'center', justifyContent: 'center',
  },
});
