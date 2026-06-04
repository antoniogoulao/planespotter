import React from 'react';
import {
  G, Image as SvgImage, Polygon, Rect,
  Text as SvgText,
} from 'react-native-svg';
import { Ident, Route } from '../types';

export interface AirlineTagProps {
  ident: Ident;
  callsign: string;
  alt: number;           // baro altitude in metres — displayed as flight level
  x: number;
  y: number;
  heading: number;       // rotates the arrow
  labelRotation: number; // counter-rotates the label to stay upright on the disc
  route?: Route | null;
}

function toFL(altMetres: number): string {
  const fl = Math.round((Math.max(0, altMetres) * 3.28084) / 100);
  return `FL${String(fl).padStart(3, '0')}`;
}

// Static map of logos keyed by 3-letter ICAO designator.
// Add a new entry here whenever a PNG is dropped in assets/logos/.
const LOGO_MAP: Record<string, ReturnType<typeof require>> = {
  ACA: require('../../assets/logos/ACA.png'),
  AEA: require('../../assets/logos/AEA.png'),
  AFP: require('../../assets/logos/AFP.png'),
  AFR: require('../../assets/logos/AFR.png'),
  AME: require('../../assets/logos/AME.png'),
  AMX: require('../../assets/logos/AMX.png'),
  AVA: require('../../assets/logos/AVA.png'),
  AZU: require('../../assets/logos/AZU.png'),
  BAW: require('../../assets/logos/BAW.png'),
  BEL: require('../../assets/logos/DAT.png'),
  BGA: require('../../assets/logos/BGA.png'),
  DAL: require('../../assets/logos/DAL.png'),
  DAT: require('../../assets/logos/DAT.png'),
  DLH: require('../../assets/logos/DLH.png'),
  EIN: require('../../assets/logos/EIN.png'),
  EJA: require('../../assets/logos/EJA.png'),
  ETD: require('../../assets/logos/ETD.png'),
  EWG: require('../../assets/logos/EWG.png'),
  EZY: require('../../assets/logos/EZY.png'),
  FIN: require('../../assets/logos/FIN.png'),
  GEC: require('../../assets/logos/GEC.png'),
  HLX: require('../../assets/logos/HLX.png'),
  IBB: require('../../assets/logos/IBB.png'),
  IBE: require('../../assets/logos/IBE.png'),
  IBS: require('../../assets/logos/IBS.png'),
  JFL: require('../../assets/logos/JFL.png'),
  KLM: require('../../assets/logos/KLM.png'),
  MMZ: require('../../assets/logos/MMZ.png'),
  NAX: require('../../assets/logos/NAX.png'),
  QTR: require('../../assets/logos/QTR.png'),
  RAM: require('../../assets/logos/RAM.png'),
  RYR: require('../../assets/logos/RYR.png'),
  RZO: require('../../assets/logos/RZO.png'),
  SAS: require('../../assets/logos/SAS.png'),
  SEN: require('../../assets/logos/SEN.png'),
  SWR: require('../../assets/logos/SWR.png'),
  SWT: require('../../assets/logos/SWT.png'),
  TAP: require('../../assets/logos/TAP.png'),
  THY: require('../../assets/logos/THY.png'),
  TRA: require('../../assets/logos/TRA.png'),
  UAE: require('../../assets/logos/UAE.png'),
  UAL: require('../../assets/logos/UAL.png'),
  VLG: require('../../assets/logos/VLG.png'),
  VOE: require('../../assets/logos/VOE.png'),
  WZZ: require('../../assets/logos/WZZ.png'),
};

const BADGE_W = 24;
const BADGE_H = 14;
const BADGE_X = 10; // px right of blip centre

export function AirlineTag({
  ident, callsign, alt, x, y, heading, labelRotation, route = null,
}: AirlineTagProps) {
  const logo =
    ident.kind === 'airline' && ident.code != null
      ? LOGO_MAP[ident.code]
      : undefined;

  const isMil = ident.kind === 'military';
  const badgeFill   = isMil ? '#312e81' : '#1f2937';
  const badgeStroke = isMil ? '#6d28d9' : '#374151';
  const badgeText   = isMil ? 'MIL' : (ident.code ?? 'N/A');
  const badgeColor  = isMil ? '#c4b5fd' : '#9ca3af';

  return (
    <G transform={`translate(${x}, ${y})`}>

      {/* Arrow — follows aircraft heading, NOT counter-rotated */}
      <G transform={`rotate(${heading})`}>
        <Polygon points="0,-7 -4,4 0,2 4,4" fill="#facc15" />
      </G>

      {/* Label — counter-rotated so text stays upright as disc spins */}
      <G transform={`rotate(${labelRotation})`}>

        {logo ? (
          // Airline logo PNG
          <SvgImage
            x={BADGE_X}
            y={-BADGE_H / 2}
            width={BADGE_W}
            height={BADGE_H}
            href={logo as any}
          />
        ) : (
          // Placeholder badge (grey for unknown/airline-no-logo, purple for military)
          <>
            <Rect
              x={BADGE_X}
              y={-BADGE_H / 2}
              width={BADGE_W}
              height={BADGE_H}
              rx={2}
              fill={badgeFill}
              stroke={badgeStroke}
              strokeWidth={0.5}
            />
            <SvgText
              x={BADGE_X + BADGE_W / 2}
              y={4}
              textAnchor="middle"
              fill={badgeColor}
              fontSize={6}
              fontFamily="monospace"
            >
              {badgeText}
            </SvgText>
          </>
        )}

        {/* Callsign text — 8 px gap after badge */}
        <SvgText
          x={BADGE_X + BADGE_W + 8}
          y={4}
          fill="#facc15"
          fontSize={8}
          fontFamily="monospace"
        >
          {callsign.trim()}
        </SvgText>

        {/* Flight level — below callsign */}
        <SvgText
          x={BADGE_X + BADGE_W + 8}
          y={14}
          fill="#9ca3af"
          fontSize={7}
          fontFamily="monospace"
        >
          {toFL(alt)}
        </SvgText>

        {/* Route — departure → destination, shown when available */}
        {route?.origin.iata && route?.destination.iata && (
          <SvgText
            x={BADGE_X + BADGE_W + 8}
            y={24}
            fill="#9ca3af"
            fontSize={7}
            fontFamily="monospace"
          >
            {route.origin.iata}→{route.destination.iata}
          </SvgText>
        )}

      </G>
    </G>
  );
}
