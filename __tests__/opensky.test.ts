import { fetchAircraft } from '../src/api/opensky';

const MOCK_AIRCRAFT = [
  {
    icao24: 'abc123', callsign: 'BAW001',
    lat: 51.5, lon: -0.1, alt: 8000,
    velocity: 250, heading: 90, verticalRate: -5, lastUpdate: 1_000_000,
  },
];

describe('fetchAircraft', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the correct URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aircraft: [] }),
    });
    await fetchAircraft(51.5, -0.1);
    expect(global.fetch).toHaveBeenCalledWith('/api/states?lat=51.5&lon=-0.1');
  });

  it('returns the aircraft array on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aircraft: MOCK_AIRCRAFT }),
    });
    const result = await fetchAircraft(51.5, -0.1);
    expect(result).toEqual(MOCK_AIRCRAFT);
  });

  it('throws on non-200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });
    await expect(fetchAircraft(51.5, -0.1)).rejects.toThrow('fetchAircraft failed: 429');
  });
});
