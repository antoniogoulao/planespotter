import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { initI18n } from '../src/i18n';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('home.title') }} />
      <Stack.Screen name="radar" options={{ title: t('radar.title') }} />
      <Stack.Screen name="ar" options={{ title: t('ar.title') }} />
    </Stack>
  );
}
