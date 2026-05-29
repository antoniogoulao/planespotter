import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, {
  Circle, ClipPath, Defs, G, Line, Path,
  Text as SvgText,
} from 'react-native-svg';
import { Aircraft } from '../types';
import { bearingTo, haversineDistance } from '../lib/geo';

export interface RadarViewProps {
  location: { lat: number; lon: number } | null;
  azimuth: number | null;
  aircraft: Aircraft[];
  rangeKm?: number;
}

const DEG = Math.PI / 180;
const RING_KM = [10, 25, 50];

export function projectToSVG(
  location: { lat: number; lon: number },
  target: { lat: number; lon: number },
  rangeM: number,
  R: number,
): { x: number; y: number } {
  const bearing = bearingTo(location, target);
  const distance = haversineDistance(location, target);
  const ratio = Math.min(distance / rangeM, 1);
  return {
    x: Math.sin(bearing * DEG) * ratio * R,
    y: -Math.cos(bearing * DEG) * ratio * R,
  };
}

function conePathD(azimuth: number, R: number): string {
  const a1 = (azimuth - 20) * DEG;
  const a2 = (azimuth + 20) * DEG;
  const x1 = R * Math.sin(a1);
  const y1 = -R * Math.cos(a1);
  const x2 = R * Math.sin(a2);
  const y2 = -R * Math.cos(a2);
  return `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

export function RadarView({ location, azimuth, aircraft, rangeKm = 50 }: RadarViewProps) {
  const { width, height } = useWindowDimensions();
  const R = Math.min(width, height) * 0.45;
  const rangeM = rangeKm * 1000;

  const visibleAircraft = location
    ? aircraft.filter(a => haversineDistance(location, a) <= rangeM)
    : [];

  const lineEnd = azimuth !== null
    ? { x: R * Math.sin(azimuth * DEG), y: -R * Math.cos(azimuth * DEG) }
    : null;

  return (
    <View style={styles.container}>
      <Svg
        width={R * 2}
        height={R * 2}
        viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`}
      >
        <Defs>
          <ClipPath id="disc">
            <Circle cx={0} cy={0} r={R} />
          </ClipPath>
        </Defs>

        {/* Background disc */}
        <Circle cx={0} cy={0} r={R} fill="#050f08" />

        {/* Range rings */}
        {RING_KM.map(km => (
          <Circle
            key={km}
            cx={0} cy={0}
            r={(km / rangeKm) * R}
            fill="none"
            stroke="#1e3a2a"
            strokeWidth={1}
          />
        ))}

        {/* Range labels */}
        {RING_KM.map(km => (
          <SvgText
            key={`lbl-${km}`}
            x={4}
            y={-(km / rangeKm) * R + 10}
            fill="#374151"
            fontSize={9}
            fontFamily="monospace"
          >
            {String(km)}
          </SvgText>
        ))}

        {/* Cardinal markers */}
        <SvgText x={0}        y={-(R - 12)} fill="#6b7280" fontSize={10} textAnchor="middle" fontFamily="sans-serif">N</SvgText>
        <SvgText x={0}        y={R - 4}     fill="#6b7280" fontSize={10} textAnchor="middle" fontFamily="sans-serif">S</SvgText>
        <SvgText x={R - 6}    y={4}         fill="#6b7280" fontSize={10} textAnchor="end"    fontFamily="sans-serif">E</SvgText>
        <SvgText x={-(R - 6)} y={4}         fill="#6b7280" fontSize={10} textAnchor="start"  fontFamily="sans-serif">W</SvgText>

        {/* Heading indicator — cone */}
        {azimuth !== null && (
          <Path
            d={conePathD(azimuth, R)}
            fill="rgba(74,222,128,0.15)"
            clipPath="url(#disc)"
          />
        )}

        {/* Heading indicator — dashed centre line */}
        {lineEnd && (
          <Line
            x1={0} y1={0}
            x2={lineEnd.x} y2={lineEnd.y}
            stroke="#4ade80"
            strokeWidth={1.5}
            strokeDasharray="6,4"
            opacity={0.7}
          />
        )}

        {/* Aircraft blips */}
        <G clipPath="url(#disc)">
          {location && visibleAircraft.map(ac => {
            const { x, y } = projectToSVG(location, ac, rangeM, R);
            return (
              <G key={ac.icao24}>
                <Circle cx={x} cy={y} r={4} fill="#facc15" />
                <SvgText
                  x={x + 8}
                  y={y + 4}
                  fill="#facc15"
                  fontSize={8}
                  fontFamily="monospace"
                >
                  {ac.callsign.trim()}
                </SvgText>
              </G>
            );
          })}
        </G>

        {/* Own-ship */}
        <Circle cx={0} cy={0} r={5} fill="#60a5fa" />

        {/* Locating… */}
        {!location && (
          <SvgText x={0} y={4} fill="#6b7280" fontSize={11} textAnchor="middle" fontFamily="sans-serif">
            Locating…
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});
