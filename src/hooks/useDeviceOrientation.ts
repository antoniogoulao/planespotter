import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Orientation } from '../types';

const ALPHA = 0.2;

interface Vec3 { x: number; y: number; z: number }

function lerp(prev: Vec3, next: Vec3): Vec3 {
  return {
    x: prev.x + ALPHA * (next.x - prev.x),
    y: prev.y + ALPHA * (next.y - prev.y),
    z: prev.z + ALPHA * (next.z - prev.z),
  };
}

export function useDeviceOrientation(): Orientation | null {
  const [state, setState] = useState<Orientation | null>(null);
  const accel = useRef<Vec3 | null>(null);
  const azimuthRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let headingSub: Location.LocationSubscription | null = null;

    Accelerometer.setUpdateInterval(100);

    function compute() {
      const a = accel.current;
      const az = azimuthRef.current;
      if (!a || az === null) return;

      // Portrait mode: up/down tilt changes a.z and a.y, not a.x.
      // atan2(a.z, -a.y) gives the camera elevation angle from horizontal.
      const elevation = Math.atan2(a.z, -a.y) * (180 / Math.PI);

      setState({ azimuth: az, elevation });
    }

    const aSub = Accelerometer.addListener((raw) => {
      accel.current = accel.current ? lerp(accel.current, raw) : raw;
      compute();
    });

    Location.watchHeadingAsync((heading) => {
      if (cancelled) return;
      // trueHeading is -1 on iOS when unavailable; fall back to magnetic heading
      azimuthRef.current = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
      compute();
    }).then((sub) => {
      if (cancelled) {
        sub.remove();
      } else {
        headingSub = sub;
      }
    });

    return () => {
      cancelled = true;
      aSub.remove();
      headingSub?.remove();
    };
  }, []);

  return state;
}