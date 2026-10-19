import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { RadarView } from '../src/components/RadarView';
import { useAircraft } from '../src/hooks/useAircraft';
import { useRoutes } from '../src/hooks/useRoutes';

// Aircraft are fetched within 50 km (server/proxy.mjs), so MAX can't exceed that
const MIN_RANGE_KM = 10;
const MAX_RANGE_KM = 50;

export default function RadarScreen() {
  const { t } = useTranslation();
  const [rangeKm, setRangeKm] = useState(MAX_RANGE_KM);
  const { coords, error } = useLocation();
  const orientation = useDeviceOrientation();

  const location = coords ? { lat: coords.lat, lon: coords.lon } : null;
  const azimuth = orientation?.azimuth ?? null;
  const aircraft = useAircraft(location);
  const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
  const routes = useRoutes(callsigns);

  if (error) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>{t(error)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} routes={routes} rangeKm={rangeKm} />
      <View style={styles.zoomBar}>
        <Slider
          style={styles.slider}
          minimumValue={MIN_RANGE_KM}
          maximumValue={MAX_RANGE_KM}
          step={1}
          value={rangeKm}
          onValueChange={setRangeKm}
          // inverted: 50 km on the left, slide right to zoom in; track tints swap sides with it
          inverted
          minimumTrackTintColor="#1e3a2a"
          maximumTrackTintColor="#4ade80"
          thumbTintColor="#4ade80"
          accessibilityLabel={t('radar.range')}
        />
        <Text style={styles.rangeText}>{rangeKm} km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  error: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#ef4444', fontSize: 14 },
  zoomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  slider: { flex: 1, height: 40 },
  rangeText: { color: '#6b7280', fontSize: 13, fontFamily: 'monospace', width: 52, textAlign: 'right' },
});
