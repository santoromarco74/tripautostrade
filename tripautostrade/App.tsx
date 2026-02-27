import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { ReviewsProvider } from './context/ReviewsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import TabNavigator from './navigation/TabNavigator';
import ReviewsScreen from './screens/ReviewsScreen';
import AddReviewScreen from './screens/AddReviewScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { RootStackParamList, AuthStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
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
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;

  return session ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ReviewsProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ReviewsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
