import React from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED, setLanguage } from '../i18n';

const NAMES: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'fr-FR': 'Français',
  'pt-PT': 'Português (Portugal)',
  'pt-BR': 'Português (Brasil)',
  'es-ES': 'Español',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
};

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <FlatList
      data={SUPPORTED}
      keyExtractor={(tag) => tag}
      renderItem={({ item: tag }) => (
        <Pressable
          style={styles.row}
          onPress={() => void setLanguage(tag)}
        >
          <Text style={styles.name}>{NAMES[tag] ?? tag}</Text>
          {current === tag && <Text style={styles.check}>✓</Text>}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#374151',
  },
  name: { color: '#f3f4f6', fontSize: 16 },
  check: { color: '#4ade80', fontSize: 16, fontWeight: '700' },
});
