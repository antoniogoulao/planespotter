import { fetchRoute } from '../src/api/adsbdb';

const MOCK_LIS = {
  iata_code: 'LIS', icao_code: 'LPPT',
  name: 'Humberto Delgado Airport', municipality: 'Lisbon',
  country_iso_name: 'PT', country_name: 'Portugal',
  elevation: 114, latitude: 38.7813, longitude: -9.13592,
};

const MOCK_AMS = {
  iata_code: 'AMS', icao_code: 'EHAM',
  name: 'Amsterdam Airport Schiphol', municipality: 'Amsterdam',
  country_iso_name: 'NL', country_name: 'Netherlands',
  elevation: -11, latitude: 52.308601, longitude: 4.76389,
};

// Real adsbdb shape: response.flightroute.{origin,destination}
const FOUND_RESPONSE = {
  response: {
    flightroute: { callsign: 'TAP1234', origin: MOCK_LIS, destination: MOCK_AMS },
  },
};

// Real adsbdb "not found" shape: response is a string
const NOT_FOUND_RESPONSE = { response: 'unknown callsign' };

describe('fetchRoute', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  afterEach(() => { jest.restoreAllMocks(); });

  it('calls the correct adsbdb URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => NOT_FOUND_RESPONSE,
    });
    await fetchRoute('TAP1234');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.adsbdb.com/v0/callsign/TAP1234',
    );
  });

  it('returns a Route with mapped fields when callsign is found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => FOUND_RESPONSE,
    });
    const route = await fetchRoute('TAP1234');
    expect(route).toEqual({
      origin:      { iata: 'LIS', icao: 'LPPT', name: 'Humberto Delgado Airport', city: 'Lisbon' },
      destination: { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam' },
    });
  });

  it('returns null when response is a string (callsign not found)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => NOT_FOUND_RESPONSE,
    });
    expect(await fetchRoute('ZZZ999')).toBeNull();
  });

  it('returns null on non-200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 429 });
    expect(await fetchRoute('TAP1234')).toBeNull();
  });

  it('returns null on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network request failed'));
    expect(await fetchRoute('TAP1234')).toBeNull();
  });
});
