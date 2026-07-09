import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHANNELS, SEND_STATUSES, NOTIF_STATUS_BADGE, CHANNEL_BADGE, deliveryLabel, canResend, trendSeries,
} from './notification-view.ts';

test('channels include future-ready PUSH and SMS alongside WhatsApp/Email', () => {
  assert.deepEqual([...CHANNELS], ['WHATSAPP', 'EMAIL', 'PUSH', 'SMS']);
  for (const c of CHANNELS) assert.ok(CHANNEL_BADGE[c]);
});

test('badges: SENT green, PENDING amber, FAILED red', () => {
  assert.match(NOTIF_STATUS_BADGE.SENT, /emerald/);
  assert.match(NOTIF_STATUS_BADGE.PENDING, /amber/);
  assert.match(NOTIF_STATUS_BADGE.FAILED, /red/);
  assert.deepEqual([...SEND_STATUSES], ['PENDING', 'SENT', 'FAILED']);
});

test('delivery duration label: null, seconds, minutes', () => {
  assert.equal(deliveryLabel(null), '—');
  assert.equal(deliveryLabel(12), '12s');
  assert.equal(deliveryLabel(90), '1m 30s');
});

test('resend button visibility mirrors the backend FAILED-only guard', () => {
  assert.equal(canResend('FAILED'), true);
  assert.equal(canResend('SENT'), false);
  assert.equal(canResend('PENDING'), false);
});

test('success trend series: per-day success %, zero-safe', () => {
  const series = trendSeries([
    { day: '2026-07-06', sent: 8, failed: 2 },
    { day: '2026-07-07', sent: 0, failed: 0 },
  ]);
  assert.deepEqual(series, [
    { label: '2026-07-06', value: 80 },
    { label: '2026-07-07', value: 0 },
  ]);
});
