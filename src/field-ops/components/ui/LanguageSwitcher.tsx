import React, { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity } from '@/field-ops/components/primitives';
import { Globe } from 'lucide-react';
import { useLocale } from '@/field-ops/context/LocaleContext';
import { colors } from '@/field-ops/theme/tokens';

/**
 * Small language switcher (globe icon). Tapping opens a modal to choose English or Kinyarwanda.
 * Use on auth screen and in app header so language can be changed from the start; choice persists via AsyncStorage.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [modalVisible, setModalVisible] = useState(false);

  const selectLocale = (l: 'en' | 'rn') => {
    setLocale(l);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
        accessibilityLabel={t('settings_language')}
      >
        <Globe size={18} color={colors.gray500} />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center p-6"
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            className="bg-white rounded-xl p-5 w-full max-w-xs"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-gray-900 mb-4">{t('settings_language')}</Text>
            <TouchableOpacity
              onPress={() => selectLocale('en')}
              className={`py-3 px-4 rounded-lg mb-2 ${locale === 'en' ? 'bg-blue-600' : 'bg-gray-100'}`}
            >
              <Text className={locale === 'en' ? 'text-white font-semibold' : 'text-gray-800'}>
                {t('settings_language_english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectLocale('rn')}
              className={`py-3 px-4 rounded-lg ${locale === 'rn' ? 'bg-blue-600' : 'bg-gray-100'}`}
            >
              <Text className={locale === 'rn' ? 'text-white font-semibold' : 'text-gray-800'}>
                {t('settings_language_kinyarwanda')}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
