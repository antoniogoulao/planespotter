import { ZOOM_CONFIG, nextZoom } from '../src/lib/arConfig';

describe('ZOOM_CONFIG', () => {
  it('has correct cameraZoom values', () => {
    expect(ZOOM_CONFIG['1x'].cameraZoom).toBe(0);
    expect(ZOOM_CONFIG['2x'].cameraZoom).toBe(0.2);
    expect(ZOOM_CONFIG['4x'].cameraZoom).toBe(0.4);
  });

  it('halves the FOV at 2x', () => {
    expect(ZOOM_CONFIG['2x'].fov.h).toBeCloseTo(ZOOM_CONFIG['1x'].fov.h / 2);
    expect(ZOOM_CONFIG['2x'].fov.v).toBeCloseTo(ZOOM_CONFIG['1x'].fov.v / 2);
  });

  it('quarters the FOV at 4x', () => {
    expect(ZOOM_CONFIG['4x'].fov.h).toBeCloseTo(ZOOM_CONFIG['1x'].fov.h / 4);
    expect(ZOOM_CONFIG['4x'].fov.v).toBeCloseTo(ZOOM_CONFIG['1x'].fov.v / 4);
  });
});

describe('nextZoom', () => {
  it('cycles 1x → 2x', () => expect(nextZoom('1x')).toBe('2x'));
  it('cycles 2x → 4x', () => expect(nextZoom('2x')).toBe('4x'));
  it('cycles 4x → 1x', () => expect(nextZoom('4x')).toBe('1x'));
});