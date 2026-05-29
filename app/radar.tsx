import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

export default function RadarScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('radar.title')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 24, fontWeight: '600' },
});
