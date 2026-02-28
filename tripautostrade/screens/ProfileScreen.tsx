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
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={52} color={Colors.primary} />
        </View>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
        <Text style={styles.uid}>ID: {user?.id?.slice(0, 8)}…</Text>
      </View>

      <View style={styles.sezione}>
        <View style={styles.riga}>
          <View style={styles.iconWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.rigaTesto}>{user?.email}</Text>
        </View>
        <View style={styles.divisore} />
        <View style={styles.riga}>
          <View style={styles.iconWrapper}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.rigaTesto}>
            Iscritto il{' '}
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString('it-IT')
              : '—'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout} activeOpacity={0.8}>
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
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  email: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  uid: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  sezione: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  riga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rigaTesto: {
    fontSize: 14,
    color: '#444',
    flexShrink: 1,
  },
  divisore: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 14,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d32f2f',
    borderRadius: 16,
    paddingVertical: 14,
  },
  btnLogoutTesto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
