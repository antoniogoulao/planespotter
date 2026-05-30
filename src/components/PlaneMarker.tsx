import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Aircraft, Route } from '../types';
import { PlaneSprite } from './PlaneSprite';

export interface PlaneMarkerProps {
  aircraft: Aircraft;
  route: Route | null;
  x: number;
  y: number;
}

function toFL(altMetres: number): string {
  const fl = Math.round((Math.max(0, altMetres) * 3.28084) / 100);
  return `FL${String(fl).padStart(3, '0')}`;
}

export function PlaneMarker({ aircraft, route, x, y }: PlaneMarkerProps) {
  return (
    <View style={[styles.container, { left: x, top: y }]}>
      <View style={styles.card}>
        <Text style={styles.callsign}>{aircraft.callsign.trim()}</Text>
        <Text style={styles.secondary}>{toFL(aircraft.alt)}</Text>
        {route?.origin.iata && route?.destination.iata && (
          <Text style={styles.secondary}>
            {route.origin.iata}→{route.destination.iata}
          </Text>
        )}
      </View>
      <View style={styles.stem} />
      <PlaneSprite />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -50 }, { translateY: -93 }],
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    borderColor: '#facc15',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 80,
    alignItems: 'flex-start',
  },
  callsign: {
    color: '#facc15',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
  secondary: {
    color: '#9ca3af',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  stem: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(250,204,21,0.5)',
  },
});
