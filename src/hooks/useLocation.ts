import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  coords: { lat: number; lon: number; alt: number; accuracy: number } | null;
  error: string | null;
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({ coords: null, error: null });

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ coords: null, error: 'Location permission not granted' });
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 1 },
        (loc) => {
          setState({
            coords: {
              lat: loc.coords.latitude,
              lon: loc.coords.longitude,
              alt: loc.coords.altitude ?? 0,
              accuracy: loc.coords.accuracy ?? 0,
            },
            error: null,
          });
        },
      );
    })();

    return () => { sub?.remove(); };
  }, []);

  return state;
}
