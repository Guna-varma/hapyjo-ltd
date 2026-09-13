import React, { useState, useEffect } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from '@/field-ops/components/primitives';
import { useAuth } from '@/field-ops/context/AuthContext';
import { useLocale } from '@/field-ops/context/LocaleContext';
// RN's require() for a bundled image becomes an ES import; Vite emits a hashed URL.
import hapyjoLogo from '@/field-ops/assets/hapyjo_playstore_icon_v2_512.png';
import { useResponsiveTheme } from '@/field-ops/theme/responsive';
import { FormScreenLayout } from '@/field-ops/components/ui/FormScreenLayout';
import { Input } from '@/field-ops/components/ui/Input';
import { Button } from '@/field-ops/components/ui/Button';
import { LanguageSwitcher } from '@/field-ops/components/ui/LanguageSwitcher';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { colors, dimensions } from '@/field-ops/theme/tokens';
import { requestNotificationPermissionAsync } from '@/field-ops/lib/registerPushToken';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const id = setTimeout(() => {
      requestNotificationPermissionAsync();
    }, 1500);
    return () => clearTimeout(id);
  }, []);

  const { t } = useLocale();
  const theme = useResponsiveTheme();
  /**
   * Phones keep the sticky bottom bar (thumb reach, keyboard-safe). On a desktop
   * window a bar pinned to the bottom of a tall screen sits far from the form, so
   * the button lives inside the card instead.
   */
  const buttonInCard = theme.isDesktop;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('alert_error'), t('login_enter_both'));
      return;
    }
    requestNotificationPermissionAsync();
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('login_invalid_credentials');
      Alert.alert(t('login_failed_title'), message);
    } finally {
      setLoading(false);
    }
  };

  const signInButton = (
    <Button onPress={handleLogin} loading={loading} fullWidth>
      {t('login_title')}
    </Button>
  );

  return (
    <FormScreenLayout
      header={
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/*
            Back to the marketing website. A plain link: the website is a separate
            Vite entry, so this must be a full navigation, not a router route.
          */}
          <TouchableOpacity
            onPress={() => {
              window.location.assign('/');
            }}
            accessibilityLabel={t('login_back_to_website')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              minHeight: dimensions.minTouchHeight,
              paddingVertical: 8,
              paddingRight: 12,
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            <ArrowLeft size={20} color={colors.primary} />
            <Text
              style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}
              numberOfLines={1}
            >
              {t('login_back_to_website')}
            </Text>
          </TouchableOpacity>
          <LanguageSwitcher />
        </View>
      }
      footer={buttonInCard ? null : signInButton}
      contentPadding={theme.screenPadding}
    >
      <View className="items-center mb-8">
        <Image
          source={hapyjoLogo}
          className="w-40 h-16 mb-4"
          resizeMode="contain"
        />
        <Text className="text-3xl font-bold text-gray-900">{t('login_company_name')}</Text>
        <Text className="text-base text-gray-600 mt-2">{t('login_tagline')}</Text>
      </View>

      <View className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <Text className="text-xl font-semibold text-gray-900 mb-6">{t('login_title')}</Text>

        <Input
          label={`${t('login_email')} *`}
          placeholder={t('login_email_placeholder')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          enterKeyHint="next"
        />

        <Input
          label={`${t('login_password')} *`}
          placeholder={t('login_password_placeholder')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          enterKeyHint="done"
          onSubmitEditing={handleLogin}
          rightElement={
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              accessibilityRole="button"
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            </TouchableOpacity>
          }
        />

        {buttonInCard ? <View className="mt-2">{signInButton}</View> : null}

        <View className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text className="text-xs font-semibold text-blue-900 mb-2">{t('login_internal_accounts')}</Text>
          <Text className="text-xs text-blue-800">{t('login_internal_hint')}</Text>
          <Text className="text-xs text-blue-700 mt-2 italic">{t('login_forgot_hint')}</Text>
        </View>
      </View>
    </FormScreenLayout>
  );
}
