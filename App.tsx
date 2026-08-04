import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { initSentry, Sentry } from './lib/sentry';
import { ReviewsProvider } from './context/ReviewsContext';
import OfflineBanner from './components/OfflineBanner';
import UpdateBanner from './components/UpdateBanner';

initSentry();
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import TabNavigator from './navigation/TabNavigator';
import ReviewsScreen from './screens/ReviewsScreen';
import AddReviewScreen from './screens/AddReviewScreen';
import ServiceAreaScreen from './screens/ServiceAreaScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { isLoading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#006633" />
      </View>
    );
  }

  // L'app è navigabile senza account (mappa, recensioni, classifica sono
  // pubbliche lato RLS — vedi security_rls.sql). Login resta una schermata
  // raggiungibile, non un requisito per vedere l'app: le azioni che scrivono
  // dati la richiedono singolarmente (vedi useRequireAuth).
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="ServiceArea"
          component={ServiceAreaScreen}
          options={{ headerShown: true, title: 'Area di Servizio' }}
        />
        <Stack.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{ headerShown: true, title: 'Recensioni' }}
        />
        <Stack.Screen
          name="AddReview"
          component={AddReviewScreen}
          options={{ headerShown: true, title: 'Scrivi una recensione', presentation: 'modal' }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: true, title: '', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const queryClient = new QueryClient();

// Collega React Query allo stato rete reale del dispositivo (expo-network):
// le query stale vengono rifetchate automaticamente al ritorno online.
onlineManager.setEventListener((setOnline) => {
  const sub = Network.addNetworkStateListener((state) => {
    setOnline(state.isConnected !== false);
  });
  return () => sub.remove();
});

function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FavoritesProvider>
            <ReviewsProvider>
              <View style={{ flex: 1 }}>
                <RootNavigator />
                <OfflineBanner />
                <UpdateBanner />
              </View>
            </ReviewsProvider>
          </FavoritesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
