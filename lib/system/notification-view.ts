import type { NotificationChannel, NotificationSendStatus } from '@/lib/admin';

/** Pure view helpers for the Notification Center (backend values rendered verbatim). */

// Channel filter list — PUSH/SMS are future-ready (already in the backend enum).
export const CHANNELS: NotificationChannel[] = ['WHATSAPP', 'EMAIL', 'PUSH', 'SMS'];
export const SEND_STATUSES: NotificationSendStatus[] = ['PENDING', 'SENT', 'FAILED'];

export const NOTIF_STATUS_BADGE: Record<NotificationSendStatus, string> = {
  SENT: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
};

export const CHANNEL_BADGE: Record<string, string> = {
  WHATSAPP: 'bg-emerald-100 text-emerald-700',
  EMAIL: 'bg-blue-100 text-blue-700',
  PUSH: 'bg-purple-100 text-purple-700',
  SMS: 'bg-amber-100 text-amber-700',
  IN_APP: 'bg-gray-100 text-gray-600',
};

/** Delivery duration label: null → —, 12 → 12s, 90 → 1m 30s. */
export function deliveryLabel(sec: number | null): string {
  if (sec == null) return '—';
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

/** Whether the resend action applies (FAILED only — mirrors the backend guard). */
export function canResend(status: NotificationSendStatus): boolean {
  return status === 'FAILED';
}

/** Success-trend chart series: per-day success percentage (0 when no traffic). */
export function trendSeries(trend: Array<{ day: string; sent: number; failed: number }>): Array<{ label: string; value: number }> {
  return trend.map((t) => {
    const total = t.sent + t.failed;
    return { label: t.day, value: total === 0 ? 0 : Math.round((t.sent / total) * 100) };
  });
}
