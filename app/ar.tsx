import { Button, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../src/hooks/useLocation';
import { useDeviceOrientation } from '../src/hooks/useDeviceOrientation';
import { useAircraft } from '../src/hooks/useAircraft';
import { useRoutes } from '../src/hooks/useRoutes';
import { AROverlay } from '../src/components/AROverlay';

export default function ARScreen() {
  const { t } = useTranslation();
  const { coords } = useLocation();
  const orientation = useDeviceOrientation();
  const [camPermission, requestCamPermission] = useCameraPermissions();

  const location = coords
    ? { lat: coords.lat, lon: coords.lon, alt: coords.alt }
    : null;

  const aircraft  = useAircraft(location);
  const callsigns = aircraft.map(ac => ac.callsign).filter(Boolean);
  const routes    = useRoutes(callsigns);

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

  return (
    <View style={styles.fill}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />
      <AROverlay
        style={StyleSheet.absoluteFill}
        aircraft={aircraft}
        location={location}
        orientation={orientation}
        routes={routes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill:      { flex: 1, backgroundColor: '#000' },
  error:     { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
});
