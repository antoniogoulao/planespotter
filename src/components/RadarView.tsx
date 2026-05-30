import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, {
  Circle, ClipPath, Defs, G, Line, Path,
  Text as SvgText,
} from 'react-native-svg';
import { Aircraft, Route } from '../types';
import { bearingTo, haversineDistance } from '../lib/geo';
import { AirlineTag } from './AirlineTag';
import { identify } from '../lib/airlines';

export interface RadarViewProps {
  location: { lat: number; lon: number } | null;
  azimuth: number | null;
  aircraft: Aircraft[];
  rangeKm?: number;
  routes?: Map<string, Route | null>;
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

// Fixed cone at top (0° = pointing up), used as heading indicator
function fixedConePathD(R: number): string {
  const a1 = -20 * DEG;
  const a2 = 20 * DEG;
  const x1 = R * Math.sin(a1);
  const y1 = -R * Math.cos(a1);
  const x2 = R * Math.sin(a2);
  const y2 = -R * Math.cos(a2);
  return `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

export function RadarView({ location, azimuth, aircraft, rangeKm = 50, routes = new Map() }: RadarViewProps) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const R = Math.min(width, height) * 0.45;
  const rangeM = rangeKm * 1000;
  const discRotation = azimuth !== null ? -azimuth : 0;

  const visibleAircraft = location
    ? aircraft.filter(a => haversineDistance(location, a) <= rangeM)
    : [];

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

        {/* Background disc (never rotates) */}
        <Circle cx={0} cy={0} r={R} fill="#050f08" />

        {/* Rotating disc content: rings, labels, cardinals, aircraft */}
        <G transform={`rotate(${discRotation})`}>
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

          {/* Aircraft blips — AirlineTag owns arrow + label */}
          <G clipPath="url(#disc)">
            {location && visibleAircraft.map(ac => {
              const { x, y } = projectToSVG(location, ac, rangeM, R);
              return (
                <AirlineTag
                  key={ac.icao24}
                  ident={identify(ac.callsign)}
                  callsign={ac.callsign}
                  alt={ac.alt}
                  x={x}
                  y={y}
                  heading={ac.heading}
                  labelRotation={-discRotation}
                  route={routes.get(ac.callsign) ?? null}
                />
              );
            })}
          </G>
        </G>

        {/* Fixed heading indicator — always at 12 o'clock */}
        <Path
          d={fixedConePathD(R)}
          fill="rgba(74,222,128,0.15)"
          clipPath="url(#disc)"
        />
        <Line
          x1={0} y1={0}
          x2={0} y2={-R}
          stroke="#4ade80"
          strokeWidth={1.5}
          strokeDasharray="6,4"
          opacity={0.7}
        />

        {/* Own-ship — always at centre */}
        <Circle cx={0} cy={0} r={5} fill="#60a5fa" />

        {/* Locating… */}
        {!location && (
          <SvgText x={0} y={4} fill="#6b7280" fontSize={11} textAnchor="middle" fontFamily="sans-serif">
            {t('radar.locating')}
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});
