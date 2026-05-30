import React from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Aircraft, Orientation, Route } from '../types';
import { projectToScreen, DEFAULT_FOV } from '../lib/projection';
import { PlaneMarker } from './PlaneMarker';

export interface AROverlayProps {
  aircraft: Aircraft[];
  location: { lat: number; lon: number; alt: number } | null;
  orientation: Orientation | null;
  routes: Map<string, Route | null>;
  fov?: { h: number; v: number };
  style?: ViewStyle;
}

export function AROverlay({
  aircraft, location, orientation, routes, fov, style,
}: AROverlayProps) {
  const { width, height } = useWindowDimensions();

  if (!location || !orientation) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {aircraft.map(ac => {
        const pos = projectToScreen(
          location,
          orientation,
          ac,
          { width, height },
          fov ?? DEFAULT_FOV,
        );
        if (!pos) return null;
        return (
          <PlaneMarker
            key={ac.icao24}
            aircraft={ac}
            route={routes.get(ac.callsign) ?? null}
            x={pos.x}
            y={pos.y}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
