import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { TabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<TabParamList>();

// ─── Design System "The Modern Wayfarer" ─────────────────────────────────────
const P_ACTIVE   = '#004F45'; // Verde Autostrada — active icon/label
const INACTIVE   = '#BEC9C5'; // Sage grey — inactive icon/label

type MatIcon = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_ICONS: Record<keyof TabParamList, { outline: MatIcon; filled: MatIcon }> = {
  Esplora:  { outline: 'map',              filled: 'map'    },
  Attività: { outline: 'format-list-bulleted', filled: 'format-list-bulleted' },
  Profilo:  { outline: 'person-outline',   filled: 'person' },
};

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   P_ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarShowLabel: false,
        tabBarStyle: {
          // Background: pure white per Modern Wayfarer
          backgroundColor: '#FFFFFF',
          // Remove hard native border, replace with soft shadow
          borderTopWidth: 0,
          // Soft upward shadow
          elevation: 12,
          shadowColor: '#004F45',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          // Rounded top corners
          borderTopLeftRadius:  24,
          borderTopRightRadius: 24,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons = TAB_ICONS[route.name as keyof TabParamList];
          return (
            <MaterialIcons
              name={focused ? icons.filled : icons.outline}
              size={24}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Esplora"  component={HomeScreen}     />
      <Tab.Screen name="Attività" component={ActivityScreen} />
      <Tab.Screen name="Profilo"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
}
