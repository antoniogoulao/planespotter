import React, { useRef, useState } from 'react';
import { Animated, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useTranslation } from 'react-i18next';
import ViewShot, { ViewShotRef } from 'react-native-view-shot';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { useAircraft } from '../src/hooks/useAircraft';
import { useRoutes } from '../src/hooks/useRoutes';
import { AROverlay } from '../src/components/AROverlay';
import { ZOOM_CONFIG, ZoomLevel, nextZoom } from '../src/lib/arConfig';

function ShutterButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.shutter, disabled && styles.shutterDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel="Take photo"
    />
  );
}

function ZoomPill({ zoom, onPress }: { zoom: ZoomLevel; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.zoomPill} onPress={onPress} accessibilityLabel={`Zoom ${zoom}`}>
      <Text style={styles.zoomText}>{zoom}</Text>
    </TouchableOpacity>
  );
}

export default function ARScreen() {
  const { t } = useTranslation();
  const { coords } = useLocation();
  const orientation = useDeviceOrientation();
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [zoom, setZoom] = useState<ZoomLevel>('1x');
  const [capturing, setCapturing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShotRef>(null);

  const location = coords
    ? { lat: coords.lat, lon: coords.lon, alt: 0 }
    : null;

  const aircraft  = useAircraft(location);
  const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
  const routes    = useRoutes(callsigns);

  function showToast(message: string, duration: number) {
    setToast(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }

  function triggerFlash() {
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }

  async function handleCapture() {
    if (capturing || !viewShotRef.current) return;
    triggerFlash();
    setCapturing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast('Could not save photo', 2000);
        return;
      }
      const uri = await viewShotRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      showToast('Saved ✓', 1500);
    } catch {
      showToast('Could not save photo', 2000);
    } finally {
      setCapturing(false);
    }
  }

  function handleZoom() {
    setZoom(z => nextZoom(z));
  }

  if (!camPermission) return <View style={styles.fill} />;

  if (!camPermission.granted) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          {camPermission.canAskAgain
            ? t('ar.permissionRequired')
            : t('ar.permissionDenied')}
        </Text>
        {camPermission.canAskAgain && (
          <Button title={t('ar.grantPermission')} onPress={requestCamPermission} />
        )}
      </View>
    );
  }

  const { cameraZoom, fov } = ZOOM_CONFIG[zoom];

  return (
    <ViewShot ref={viewShotRef} style={styles.fill} options={{ format: 'jpg', quality: 0.9 }}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" zoom={cameraZoom} />
      <AROverlay
        style={StyleSheet.absoluteFill}
        aircraft={aircraft}
        location={location}
        orientation={orientation}
        routes={routes}
        fov={fov}
      />
      <View style={styles.controls} pointerEvents="box-none">
        <View style={styles.controlsBar}>
          <View style={styles.controlsSpacer} />
          <ShutterButton onPress={handleCapture} disabled={capturing} />
          <View style={styles.controlsRight}>
            <ZoomPill zoom={zoom} onPress={handleZoom} />
          </View>
        </View>
      </View>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOpacity }]}
        pointerEvents="none"
      />
      {toast !== null && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </ViewShot>
  );
}

const styles = StyleSheet.create({
  fill:      { flex: 1, backgroundColor: '#000' },
  error:     { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  debug:     { position: 'absolute', top: 80, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 6, gap: 2 },
  dbg:       { color: '#4ade80', fontFamily: 'monospace', fontSize: 11 },
  controls: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    paddingBottom: 48,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  controlsSpacer: { width: 52 },
  controlsRight:  { flex: 1, alignItems: 'flex-end' },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shutterDisabled: { opacity: 0.5 },
  flash: { backgroundColor: '#fff' },
  zoomPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  zoomText:  { color: '#fff', fontSize: 14, fontWeight: '600' },
  toast: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toastText: { color: '#fff', fontSize: 14 },
});
