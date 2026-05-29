import { View, StyleSheet } from 'react-native';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { RadarView } from '../src/components/RadarView';
import { offsetPosition } from '../src/lib/geo';
import { Aircraft } from '../src/types';

// [bearing°, distanceMetres] offsets from own-ship
const MOCK_OFFSETS: [number, number][] = [
  [45,  12_000],  // BAW123 — 12 km NE
  [210, 20_000],  // TAP456 — 20 km SSW
  [310, 35_000],  // RYR789 — 35 km NW
];

type AircraftBase = Omit<Aircraft, 'lat' | 'lon'>;

const MOCK_BASE: AircraftBase[] = [
  { icao24: 'abc001', callsign: 'BAW123', alt: 10000, velocity: 250, heading: 60,  verticalRate: 0,  lastUpdate: 0 },
  { icao24: 'abc002', callsign: 'TAP456', alt: 8000,  velocity: 220, heading: 200, verticalRate: -3, lastUpdate: 0 },
  { icao24: 'abc003', callsign: 'RYR789', alt: 12000, velocity: 270, heading: 310, verticalRate: 2,  lastUpdate: 0 },
];

function offsetMockAircraft(origin: { lat: number; lon: number }): Aircraft[] {
  return MOCK_BASE.map((base, i) => {
    const [bearing, metres] = MOCK_OFFSETS[i];
    const pos = offsetPosition(origin, bearing, metres);
    return { ...base, lat: pos.lat, lon: pos.lon };
  });
}

export default function RadarScreen() {
  const { coords } = useLocation();
  const orientation = useDeviceOrientation();

  const location = coords ? { lat: coords.lat, lon: coords.lon } : null;
  const azimuth = orientation?.azimuth ?? null;
  const aircraft = location ? offsetMockAircraft(location) : [];

  return (
    <View style={styles.container}>
      <RadarView location={location} azimuth={azimuth} aircraft={aircraft} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
