import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReviewsProvider } from './context/ReviewsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import TabNavigator from './navigation/TabNavigator';
import ReviewsScreen from './screens/ReviewsScreen';
import AddReviewScreen from './screens/AddReviewScreen';
import WriteReviewScreen from './screens/WriteReviewScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ServiceAreaScreen from './screens/ServiceAreaScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { session, isLoading } = useAuth();
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

  if (!hasSeenOnboarding) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (!session) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ServiceArea"
          component={ServiceAreaScreen}
          options={{ title: 'Area di Servizio' }}
        />
        <Stack.Screen
          name="Reviews"
          component={ReviewsScreen}
          options={{ title: 'Recensioni' }}
        />
        <Stack.Screen
          name="AddReview"
          component={AddReviewScreen}
          options={{ title: 'Scrivi una recensione', presentation: 'modal' }}
        />
        <Stack.Screen
          name="WriteReview"
          component={WriteReviewScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
        <Stack.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <ReviewsProvider>
            <RootNavigator />
          </ReviewsProvider>
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
