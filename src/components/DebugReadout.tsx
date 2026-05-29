import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocation } from '../hooks/useLocation';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function DebugReadout() {
  const { coords, error } = useLocation();
  const orientation = useDeviceOrientation();

  const elev = orientation ? Math.round(orientation.elevation) : null;

  return (
    <View style={styles.container} pointerEvents="none">
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <Row label="Lat"  value={coords ? coords.lat.toFixed(5) : '—'} />
          <Row label="Lon"  value={coords ? coords.lon.toFixed(5) : '—'} />
          <Row label="Alt"  value={coords ? `${Math.round(coords.alt)} m` : '—'} />
          <Row label="Acc"  value={coords ? `±${Math.round(coords.accuracy)} m` : '—'} />
        </>
      )}
      <Row
        label="Heading"
        value={orientation ? `${Math.round(orientation.azimuth)}°` : '—'}
      />
      <Row
        label="Elevation"
        value={elev !== null ? `${elev >= 0 ? '+' : ''}${elev}°` : '—'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 48,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#9ca3af', fontSize: 12 },
  value: { color: '#f3f4f6', fontSize: 12 },
  error: { color: '#ef4444', fontSize: 12 },
});
