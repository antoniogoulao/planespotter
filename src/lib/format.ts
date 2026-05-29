import i18n from '../i18n';
export type Units = 'metric' | 'imperial';
const loc = () => i18n.language || 'en-US';

export const formatNumber = (n: number, o?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat(loc(), o).format(n);

export function formatAltitude(metres: number, units: Units) {
  return units === 'imperial'
    ? `${formatNumber(Math.round(metres * 3.28084))} ${i18n.t('units.ft')}`
    : `${formatNumber(Math.round(metres))} ${i18n.t('units.m')}`;
}

export function formatSpeed(ms: number, units: Units) {
  return units === 'imperial'
    ? `${formatNumber(Math.round(ms * 1.94384))} ${i18n.t('units.kn')}`
    : `${formatNumber(Math.round(ms * 3.6))} ${i18n.t('units.kmh')}`;
}

export const formatTime = (ms: number) =>
  new Intl.DateTimeFormat(loc(), { hour: '2-digit', minute: '2-digit' }).format(ms);
