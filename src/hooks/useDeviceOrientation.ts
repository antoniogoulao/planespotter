import { useEffect, useRef, useState } from 'react';
import { Accelerometer, Magnetometer } from 'expo-sensors';
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
  const mag = useRef<Vec3 | null>(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Magnetometer.setUpdateInterval(100);

    function compute() {
      const a = accel.current;
      const m = mag.current;
      if (!a || !m) return;

      const pitch = Math.atan2(-a.x, Math.sqrt(a.y ** 2 + a.z ** 2));
      const roll = Math.atan2(a.y, a.z);

      const Bx = m.x * Math.cos(pitch) + m.z * Math.sin(pitch);
      const By =
        m.x * Math.sin(roll) * Math.sin(pitch) +
        m.y * Math.cos(roll) -
        m.z * Math.sin(roll) * Math.cos(pitch);

      const RAD = 180 / Math.PI;
      setState({
        azimuth: ((Math.atan2(-By, Bx) * RAD) + 360) % 360,
        elevation: Math.atan2(a.x, Math.sqrt(a.y ** 2 + a.z ** 2)) * RAD,
      });
    }

    const aSub = Accelerometer.addListener((raw) => {
      accel.current = accel.current ? lerp(accel.current, raw) : raw;
      compute();
    });
    const mSub = Magnetometer.addListener((raw) => {
      mag.current = mag.current ? lerp(mag.current, raw) : raw;
      compute();
    });

    return () => { aSub.remove(); mSub.remove(); };
  }, []);

  return state;
}
