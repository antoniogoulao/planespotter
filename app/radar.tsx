import { StyleSheet, Text, View } from 'react-native';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { RadarView } from '../src/components/RadarView';
import { useAircraft } from '../src/hooks/useAircraft';

export default function RadarScreen() {
  const { coords, error } = useLocation();
  const orientation = useDeviceOrientation();

  const location = coords ? { lat: coords.lat, lon: coords.lon } : null;
  const azimuth = orientation?.azimuth ?? null;
  const aircraft = useAircraft(location);

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ef4444', fontSize: 14 },
});
