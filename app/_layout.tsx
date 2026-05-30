import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { initI18n } from '../src/i18n';
import { DebugReadout } from '../src/components/DebugReadout';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: t('home.title'),
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/settings')}
                style={{ marginRight: 12 }}
              >
                <Text style={{ fontSize: 22 }}>⚙️</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="radar"    options={{ title: t('radar.title') }} />
        <Stack.Screen name="ar"       options={{ title: t('ar.title') }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      </Stack>
      {__DEV__ && (
        <>
          <TouchableOpacity
            style={styles.chip}
            onPress={() => setShowDebug((v) => !v)}
          >
            <Text style={styles.chipText}>D</Text>
          </TouchableOpacity>
          {showDebug && <DebugReadout />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
