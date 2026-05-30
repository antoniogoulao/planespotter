import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguagePicker } from '../src/components/LanguagePicker';

export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t('settings.language').toUpperCase()}</Text>
      <LanguagePicker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  heading: {
    color: '#9ca3af',
    fontSize: 13,
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
