import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { TabParamList } from '../types/navigation';
import { Colors } from '../constants/Colors';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { outline: IoniconName; filled: IoniconName }> = {
  Esplora:  { outline: 'map-outline',    filled: 'map' },
  Attività: { outline: 'list-outline',   filled: 'list' },
  Profilo:  { outline: 'person-outline', filled: 'person' },
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          return (
            <View style={[styles.pill, focused && styles.pillActive]}>
              <Ionicons
                name={focused ? icons.filled : icons.outline}
                size={22}
                color={focused ? Colors.primary : '#94A3B8'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Esplora"  component={HomeScreen} />
      <Tab.Screen name="Attività" component={ActivityScreen} />
      <Tab.Screen name="Profilo"  component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Indicatore Material 3: pillola tenue dietro l'icona della tab attiva
  pill: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: '#E6F4F1', // primary tint
  },
});
