import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type PermStatus = 'granted' | 'denied' | 'pending';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [locationStatus, setLocationStatus] = useState<PermStatus>('pending');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setLocationStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'pending');
    });
  }, []);

  const cameraStatus: PermStatus = cameraPermission?.granted
    ? 'granted'
    : cameraPermission?.canAskAgain === false
    ? 'denied'
    : 'pending';

  async function requestAll() {
    const loc = await Location.requestForegroundPermissionsAsync();
    setLocationStatus(loc.status === 'granted' ? 'granted' : loc.status === 'denied' ? 'denied' : 'pending');
    await requestCameraPermission();
  }

  const statusColor = (s: PermStatus) =>
    s === 'granted' ? '#22c55e' : s === 'denied' ? '#ef4444' : '#f59e0b';

  const statusLabel = (s: PermStatus) =>
    s === 'granted' ? t('home.permissions.granted')
    : s === 'denied' ? t('home.permissions.denied')
    : t('home.permissions.pending');

  const allGranted = locationStatus === 'granted' && cameraStatus === 'granted';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.title')}</Text>

      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/radar')}>
          <Text style={styles.navBtnText}>{t('home.radar')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/ar')}>
          <Text style={styles.navBtnText}>{t('home.ar')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.perms}>
        <Text style={styles.permsHeading}>{t('home.permissions.heading')}</Text>
        <View style={styles.permRow}>
          <Text style={styles.permLabel}>{t('home.permissions.location')}</Text>
          <Text style={[styles.permStatus, { color: statusColor(locationStatus) }]}>
            {statusLabel(locationStatus)}
          </Text>
        </View>
        <View style={styles.permRow}>
          <Text style={styles.permLabel}>{t('home.permissions.camera')}</Text>
          <Text style={[styles.permStatus, { color: statusColor(cameraStatus) }]}>
            {statusLabel(cameraStatus)}
          </Text>
        </View>
        {!allGranted && (
          <TouchableOpacity style={styles.grantBtn} onPress={requestAll}>
            <Text style={styles.grantBtnText}>{t('home.permissions.requestAll')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 32 },
  title: { fontSize: 32, fontWeight: '700' },
  nav: { flexDirection: 'row', gap: 16 },
  navBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16 },
  navBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  perms: { width: '100%', gap: 12 },
  permsHeading: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  permLabel: { fontSize: 15 },
  permStatus: { fontSize: 15, fontWeight: '500' },
  grantBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  grantBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
