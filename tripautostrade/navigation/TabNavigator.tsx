import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
        tabBarInactiveTintColor: '#9e9e9e',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          return (
            <Ionicons
              name={focused ? icons.filled : icons.outline}
              size={size}
              color={color}
            />
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
