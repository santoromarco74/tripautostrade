import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import AddReviewScreen from './screens/AddReviewScreen';
import { RootStackParamList } from './types/navigation';
import { ReviewsProvider } from './context/ReviewsContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ReviewsProvider>
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
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
    </NavigationContainer>
    </ReviewsProvider>
  );
}
