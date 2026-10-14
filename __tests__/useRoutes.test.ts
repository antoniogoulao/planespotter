import { renderHook, waitFor } from '@testing-library/react-native';
import { useRoutes } from '../src/hooks/useRoutes';
import * as adsbdb from '../src/api/adsbdb';

const MOCK_ROUTE = {
  origin:      { iata: 'LIS', icao: 'LPPT', name: 'Lisbon Airport', city: 'Lisbon' },
  destination: { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Airport', city: 'Amsterdam' },
};

describe('useRoutes', () => {
  beforeEach(() => {
    jest.spyOn(adsbdb, 'fetchRoute').mockResolvedValue(MOCK_ROUTE);
  });
  afterEach(() => jest.restoreAllMocks());

  it('returns the route for a known callsign', async () => {
    const { result } = await renderHook(() => useRoutes(['TAP1234']));
    await waitFor(() => expect(result.current.get('TAP1234')).toEqual(MOCK_ROUTE));
  });

  it('fetches each callsign exactly once across re-renders', async () => {
    const { result, rerender } = await renderHook(
      ({ cs }: { cs: string[] }) => useRoutes(cs),
      { initialProps: { cs: ['TAP1234'] } },
    );
    await waitFor(() => expect(result.current.get('TAP1234')).toBeDefined());
    await rerender({ cs: ['TAP1234'] });
    expect(adsbdb.fetchRoute).toHaveBeenCalledTimes(1);
  });

  it('stores null for callsigns with no route', async () => {
    jest.spyOn(adsbdb, 'fetchRoute').mockResolvedValue(null);
    const { result } = await renderHook(() => useRoutes(['ZZZ999']));
    await waitFor(() => expect(result.current.has('ZZZ999')).toBe(true));
    expect(result.current.get('ZZZ999')).toBeNull();
  });

  it('fetches new callsigns when they are added', async () => {
    const { result, rerender } = await renderHook(
      ({ cs }: { cs: string[] }) => useRoutes(cs),
      { initialProps: { cs: ['TAP1234'] } },
    );
    await waitFor(() => expect(result.current.get('TAP1234')).toBeDefined());
    await rerender({ cs: ['TAP1234', 'KLM001'] });
    await waitFor(() => expect(result.current.get('KLM001')).toBeDefined());
    expect(adsbdb.fetchRoute).toHaveBeenCalledTimes(2);
  });
});
