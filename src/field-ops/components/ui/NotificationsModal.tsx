import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from '@/field-ops/components/primitives';
import { UnifiedModal } from '@/field-ops/components/ui/UnifiedModal';
import { useLocale } from '@/field-ops/context/LocaleContext';
import { useMockAppStore } from '@/field-ops/context/MockAppStoreContext';
import { useToast } from '@/field-ops/context/ToastContext';
import { modalStyles } from '@/field-ops/components/ui/modalStyles';
import { formatDayLabel, formatTime } from '@/field-ops/lib/dateFormat';
import { colors, spacing } from '@/field-ops/theme/tokens';
import type { Notification } from '@/field-ops/types';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
  } = useMockAppStore();
  const [markingAll, setMarkingAll] = useState(false);

  const handleClearAll = () => {
    Alert.alert(
      t('settings_clear_notifications'),
      t('settings_clear_notifications_confirm'),
      [
        { text: t('common_cancel'), style: 'cancel' },
        { text: t('common_confirm'), style: 'destructive', onPress: () => clearAllNotifications() },
      ]
    );
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      showToast(t('notifications_all_read'));
    } catch (e) {
      Alert.alert(t('alert_error'), e instanceof Error ? e.message : '');
    } finally {
      setMarkingAll(false);
    }
  };

  /**
   * Grouped by day so a long backlog reads as "Today / Yesterday / Sep 10" instead
   * of one undifferentiated wall. The store list is newest-first already.
   */
  const groups = useMemo(() => {
    const dayLabels = { today: t('notifications_today'), yesterday: t('notifications_yesterday') };
    const out: { label: string; items: Notification[] }[] = [];
    for (const n of notifications.slice(0, 50)) {
      const label = formatDayLabel(n.createdAt, dayLabels);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [notifications, t]);

  const renderItem = (n: Notification) => (
    <TouchableOpacity
      key={n.id}
      onPress={() => {
        if (!n.read) markNotificationRead(n.id).catch(() => {});
      }}
      style={[styles.item, n.read && styles.itemRead]}
      activeOpacity={0.7}
      accessibilityLabel={`${n.title}. ${n.body}`}
    >
      <View style={styles.itemHeader}>
        {!n.read && <View style={styles.unreadDot} />}
        <Text style={[styles.itemTitle, n.read && styles.itemTitleRead]} numberOfLines={1}>
          {n.title}
        </Text>
        <Text style={styles.itemTime}>{formatTime(n.createdAt, '')}</Text>
      </View>
      <Text style={styles.itemBody} numberOfLines={2}>
        {n.body}
      </Text>
    </TouchableOpacity>
  );

  return (
    <UnifiedModal
      visible={visible}
      onClose={onClose}
      title={t('settings_notifications')}
      variant="sheet"
      keyboardAvoiding={false}
      showCloseButton={true}
      footer={
        notifications.length > 0 ? (
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={markingAll || unreadNotificationCount === 0}
              style={[
                modalStyles.btn,
                styles.markAllBtn,
                (markingAll || unreadNotificationCount === 0) && styles.btnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {markingAll ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={styles.markAllBtnText}>{t('notifications_mark_all_read')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearAll}
              style={[modalStyles.btn, styles.clearBtn]}
              activeOpacity={0.8}
            >
              <Text style={styles.clearBtnText}>{t('settings_clear_notifications')}</Text>
            </TouchableOpacity>
          </View>
        ) : undefined
      }
    >
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('settings_in_app_notifications')}</Text>
          <Text style={styles.emptySubtext}>{t('notifications_empty')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {groups.map((g) => (
            <View key={g.label}>
              <Text style={styles.dayLabel}>{g.label}</Text>
              {g.items.map(renderItem)}
            </View>
          ))}
          <Text style={styles.olderHint}>{t('notifications_older_hint')}</Text>
        </View>
      )}
    </UnifiedModal>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.xs,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  item: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemRead: {
    opacity: 0.7,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  itemTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemTitleRead: {
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 0,
  },
  itemBody: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  olderHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  markAllBtn: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  markAllBtnText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
  },
  clearBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
