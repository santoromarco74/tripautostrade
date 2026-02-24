import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';

export default function App() {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      } else {
        setPermissionGranted(false);
      }
    })();
  }, []);

  if (permissionGranted === false) {
    return (
      <View style={styles.fallback}>
        <Text>Permesso GPS negato. Impossibile trovare i ristori vicini.</Text>
      </View>
    );
  }

  if (!location) {
    return <View style={styles.fallback} />;
  }

  return (
    <MapView
      style={styles.map}
      showsUserLocation={true}
      initialRegion={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
