import { Airport, Route } from '../types';

interface AdsbDbAirport {
  iata_code: string;
  icao_code: string;
  name: string;
  municipality: string;
  [key: string]: unknown;
}

interface AdsbDbResponse {
  response: false | {
    callsign: string;
    origin: AdsbDbAirport;
    destination: AdsbDbAirport;
  };
}

function mapAirport(a: AdsbDbAirport): Airport {
  return {
    iata: a.iata_code,
    icao: a.icao_code,
    name: a.name,
    city: a.municipality,
  };
}

export async function fetchRoute(callsign: string): Promise<Route | null> {
  try {
    const res = await fetch(
      `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`,
    );
    if (!res.ok) return null;
    const data = await res.json() as AdsbDbResponse;
    if (!data.response) return null;
    return {
      origin: mapAirport(data.response.origin),
      destination: mapAirport(data.response.destination),
    };
  } catch {
    return null;
  }
}
