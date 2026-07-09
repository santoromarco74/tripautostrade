import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Come mostrare le notifiche quando l'app è in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Richiede il permesso notifiche, ottiene il token Expo Push e lo salva
 * in profiles.push_token per l'utente indicato.
 *
 * Silenziosa per design: su emulatori, in Expo Go (SDK 53+) o senza
 * permesso non fa nulla. Va chiamata dopo il login.
 */
export async function registraPushToken(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) return; // niente push su emulatori

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifiche',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
  } catch {
    // La registrazione push non deve mai bloccare o far fallire il login
  }
}

/** Rimuove il token dal profilo (da chiamare al logout). */
export async function rimuoviPushToken(userId: string): Promise<void> {
  try {
    await supabase.from('profiles').update({ push_token: null }).eq('id', userId);
  } catch {
    // non critico
  }
}
