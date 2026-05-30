import { Ident } from '../types';
import airlinesData from '../../assets/airlines.json';

type AirlineEntry = { name: string; iata: string };
const AIRLINES = airlinesData as Record<string, AirlineEntry>;

const MILITARY_PREFIXES = new Set([
  'RRR', 'CMF', 'NAF', 'GAF', 'BAF', 'FAF', 'IAF', 'SVF', 'RFF',
  'MMF', 'HAF', 'PAF', 'DAF', 'NOR', 'POR', 'SAF', 'UAF', 'CTM',
  'SQF', 'MJF', 'RFR', 'CAF', 'AAR', 'HVK',
]);

export function identify(callsign: string): Ident {
  if (!callsign.trim()) return { kind: 'na', code: null, name: 'N/A' };
  const prefix = callsign.slice(0, 3).toUpperCase();
  if (MILITARY_PREFIXES.has(prefix)) {
    return { kind: 'military', code: prefix, name: 'Military' };
  }
  const entry = AIRLINES[prefix];
  if (entry) {
    return {
      kind: 'airline',
      code: prefix,
      name: entry.name,
      iata: entry.iata || undefined,
    };
  }
  return { kind: 'na', code: prefix, name: 'N/A' };
}
