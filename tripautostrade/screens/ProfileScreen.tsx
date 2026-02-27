import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Esci', 'Vuoi davvero disconnetterti?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarBox}>
        <Ionicons name="person-circle" size={88} color={Colors.primary} />
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
        <Text style={styles.uid}>ID: {user?.id?.slice(0, 8)}…</Text>
      </View>

      <View style={styles.sezione}>
        <View style={styles.riga}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <Text style={styles.rigaTesto}>{user?.email}</Text>
        </View>
        <View style={styles.riga}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <Text style={styles.rigaTesto}>
            Iscritto il{' '}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('it-IT')
              : '—'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.btnLogoutTesto}>Disconnetti</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  avatarBox: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  email: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
  },
  uid: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  sezione: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  riga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rigaTesto: {
    fontSize: 14,
    color: '#444',
    flexShrink: 1,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnLogoutTesto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
