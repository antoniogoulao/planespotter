export type IdentKind = 'airline' | 'military' | 'na';

export interface Aircraft {
  icao24: string;
  callsign: string;
  lat: number; lon: number; alt: number; // alt in metres
  velocity: number;     // m/s
  heading: number;      // true track, degrees
  verticalRate: number; // m/s
  lastUpdate: number;   // ms epoch, for dead reckoning
}

export interface Ident { kind: IdentKind; code: string | null; name: string; iata?: string }
export interface Airport { iata: string; icao: string; name: string; city: string }
export interface Route { origin: Airport; destination: Airport }
export interface Geo { lat: number; lon: number; alt?: number }
export interface Orientation { azimuth: number; elevation: number }

export interface PlaneView {
  aircraft: Aircraft;
  ident: Ident;
  route: Route | null;
  screen: { x: number; y: number };
  source: 'detected' | 'projected';
}
