'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronRight, Copy, Download, ExternalLink, RefreshCw, Send, X } from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { PermissionGate } from '@/components/auth/permission-gate';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { TrendChart, DonutChart } from '@/components/dashboard/charts';
import { ROUTE_PERMISSIONS } from '@/lib/access';
import {
  fetchNotificationCenter, fetchNotificationDetail, resendNotification,
  NotificationCenterFilters, NotificationChannel, NotificationSendStatus,
} from '@/lib/admin';
import {
  CHANNELS, SEND_STATUSES, NOTIF_STATUS_BADGE, CHANNEL_BADGE, deliveryLabel, canResend, trendSeries,
} from '@/lib/system/notification-view';
import { relatedLinks } from '@/lib/system/queue-center-view';
import { ADMIN_LOADING_MESSAGES, runWithFeedback } from '@/lib/admin-alert';

const STATUS_COLORS: Record<string, string> = { SENT: '#22c55e', PENDING: '#f59e0b', FAILED: '#ef4444' };
const CHANNEL_COLORS: Record<string, string> = { WHATSAPP: '#22c55e', EMAIL: '#3b82f6', PUSH: '#a855f7', SMS: '#f59e0b', IN_APP: '#64748b' };
const dt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' }) : '—');
const rp = (n: number) => n.toLocaleString('id-ID');

export default function NotificationCenterPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<NotificationCenterFilters>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const patch = (p: Partial<NotificationCenterFilters>) => {
    setFilters((f) => ({ ...f, ...p }));
    setPage(1);
  };

  const query = useQuery({
    queryKey: ['notification-center', filters, page, limit],
    queryFn: () => fetchNotificationCenter({ ...filters, page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: 30_000, // auto refresh
    retry: false,
  });
  const data = query.data;
  const o = data?.overview;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['notification-center'] });
    if (selectedId) qc.invalidateQueries({ queryKey: ['notification-detail', selectedId] });
  };
  const resendM = useMutation({ mutationFn: resendNotification, onSuccess: refresh });
  const resend = (id: string) =>
    runWithFeedback({ loading: ADMIN_LOADING_MESSAGES.update, success: 'Notification queued for resend', action: () => resendM.mutateAsync(id) });

  return (
    <AdminShell requiredPermissions={ROUTE_PERMISSIONS.notifications}>
      {/* Breadcrumb + page header (existing System header pattern) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            System <ChevronRight className="h-3 w-3" /> <span className="font-medium text-gray-600">Notification Center</span>
          </nav>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">Notification Center</h2>
          <p className="mt-1 text-sm text-gray-500">Monitor every WhatsApp, Email, Push, and SMS notification sent by the platform.</p>
        </div>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {query.isLoading ? (
        <Skeleton />
      ) : query.isError || !data || !o ? (
        <Card>
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <p className="text-sm text-red-600">Unable to load the notification center.</p>
            <Button onClick={() => void query.refetch()}>Retry</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total" value={rp(o.summary.total)} />
            <Stat label="Pending" value={rp(o.summary.pending)} tone={o.summary.pending > 0 ? 'warn' : undefined} />
            <Stat label="Sending" value={rp(o.summary.sending)} />
            <Stat label="Sent" value={rp(o.summary.sent)} tone="ok" />
            <Stat label="Failed" value={rp(o.summary.failed)} tone={o.summary.failed > 0 ? 'error' : undefined} />
            <Stat label="Today's Success Rate" value={o.summary.todaySuccessRatePct != null ? `${o.summary.todaySuccessRatePct}%` : '—'} tone="ok" />
            <Stat label="Avg Delivery Time" value={deliveryLabel(o.summary.avgDeliverySec)} />
          </div>

          {/* Charts */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card>
              <CardTitle>By Status</CardTitle>
              <div className="mt-4">
                <DonutChart segments={o.byStatus.filter((s) => s.count > 0).map((s) => ({ label: s.key, value: s.count, color: STATUS_COLORS[s.key] ?? '#94a3b8' }))} />
              </div>
            </Card>
            <Card>
              <CardTitle>By Channel</CardTitle>
              <div className="mt-4">
                <DonutChart segments={o.byChannel.filter((s) => s.count > 0).map((s) => ({ label: s.key, value: s.count, color: CHANNEL_COLORS[s.key] ?? '#94a3b8' }))} />
              </div>
            </Card>
            <Card>
              <CardTitle>Success Trend (7d)</CardTitle>
              {o.trend.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500">No notifications yet.</p>
              ) : (
                <div className="mt-4"><TrendChart points={trendSeries(o.trend)} color="#22c55e" height={160} /></div>
              )}
            </Card>
          </div>

          {/* Recent failures */}
          {o.failures.length > 0 ? (
            <Card>
              <CardTitle>Recent Failures</CardTitle>
              <ul className="mt-3 space-y-2">
                {o.failures.map((f) => (
                  <li key={f.id} className="cursor-pointer rounded-lg border border-red-100 bg-red-50/50 p-2.5 text-sm" onClick={() => setSelectedId(f.id)}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{f.channel} · {f.template}</span>
                      <span className="text-xs text-gray-400">{dt(f.createdAt)} · {f.attempts} attempts</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-red-600" title={f.lastError ?? ''}>{f.lastError ?? '—'} · {f.recipient}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* List */}
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <Filter label="Search"><input defaultValue={filters.search ?? ''} onChange={(e) => patch({ search: e.target.value || undefined })} placeholder="Recipient, order, payload…" className="h-10 w-72 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#465fff] focus:bg-white" /></Filter>
              <Filter label="Channel">
                <select value={filters.channel ?? ''} onChange={(e) => patch({ channel: e.target.value as NotificationChannel | '' })} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#465fff]">
                  <option value="">All</option>{CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Filter>
              <Filter label="Status">
                <select value={filters.status ?? ''} onChange={(e) => patch({ status: e.target.value as NotificationSendStatus | '' })} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#465fff]">
                  <option value="">All</option>{SEND_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Filter>
              <Filter label="Template"><input defaultValue={filters.template ?? ''} onChange={(e) => patch({ template: e.target.value || undefined })} placeholder="order.transfer" className="h-10 w-40 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#465fff]" /></Filter>
              <Filter label="Recipient"><input defaultValue={filters.recipient ?? ''} onChange={(e) => patch({ recipient: e.target.value || undefined })} placeholder="628… / email" className="h-10 w-40 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#465fff]" /></Filter>
              <Filter label="Order ID"><input defaultValue={filters.order ?? ''} onChange={(e) => patch({ order: e.target.value || undefined })} className="h-10 w-36 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#465fff]" /></Filter>
              <Filter label="From"><input type="datetime-local" onChange={(e) => patch({ dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#465fff]" /></Filter>
              <Filter label="To"><input type="datetime-local" onChange={(e) => patch({ dateTo: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#465fff]" /></Filter>
            </div>

            <CardTitle className="mt-5">Notifications</CardTitle>
            <div className="mt-4 overflow-x-auto">
              {(data.items.length ?? 0) === 0 ? (
                <p className="p-10 text-center text-sm text-gray-500">No notifications found.</p>
              ) : (
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                      <th className="py-2 font-medium">Created</th><th className="py-2 font-medium">Channel</th><th className="py-2 font-medium">Status</th>
                      <th className="py-2 font-medium">Recipient</th><th className="py-2 font-medium">Template</th><th className="py-2 font-medium">Subject</th>
                      <th className="py-2 text-right font-medium">Attempts</th><th className="py-2 font-medium">Sent At</th><th className="py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((n) => (
                      <tr key={n.id} onClick={() => setSelectedId(n.id)} className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/70">
                        <td className="whitespace-nowrap py-2.5 text-gray-500">{dt(n.createdAt)}</td>
                        <td className="py-2.5"><Badge cls={CHANNEL_BADGE[n.channel] ?? 'bg-gray-100 text-gray-600'}>{n.channel}</Badge></td>
                        <td className="py-2.5"><Badge cls={NOTIF_STATUS_BADGE[n.status]}>{n.status}</Badge></td>
                        <td className="py-2.5 text-gray-600">{n.recipient || '—'}</td>
                        <td className="py-2.5 text-gray-500">{n.template}</td>
                        <td className="max-w-[220px] truncate py-2.5 text-gray-700" title={n.subject ?? ''}>{n.subject ?? '—'}</td>
                        <td className="py-2.5 text-right text-gray-500">{n.attempts}</td>
                        <td className="whitespace-nowrap py-2.5 text-gray-500">{dt(n.sentAt)}</td>
                        <td className="py-2.5 text-gray-500">{deliveryLabel(n.deliverySec)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {data.total > 0 ? (
              <Pagination page={data.page} limit={data.limit} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
            ) : null}
          </Card>
        </div>
      )}

      {selectedId ? <NotificationDrawer id={selectedId} onClose={() => setSelectedId(null)} onResend={(id) => void resend(id)} /> : null}
    </AdminShell>
  );
}

function NotificationDrawer({ id, onClose, onResend }: { id: string; onClose: () => void; onResend: (id: string) => void }) {
  const detail = useQuery({ queryKey: ['notification-detail', id], queryFn: () => fetchNotificationDetail(id), retry: false });
  const d = detail.data;
  const n = d?.notification;
  const copy = (text: string) => void navigator.clipboard?.writeText(text);
  const payloadJson = JSON.stringify(n?.payload ?? {}, null, 2);
  const responseJson = JSON.stringify(d?.providerResponse ?? {}, null, 2);
  const download = () => {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const links = d ? relatedLinks(d.related) : [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Notification detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
          {detail.isLoading || !d || !n ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-100" />)}</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge cls={CHANNEL_BADGE[n.channel] ?? 'bg-gray-100 text-gray-600'}>{n.channel}</Badge>
                <Badge cls={NOTIF_STATUS_BADGE[n.status]}>{n.status}</Badge>
                <span className="text-xs text-gray-400">{n.template}</span>
              </div>

              {canResend(n.status) ? (
                <PermissionGate permissions={ROUTE_PERMISSIONS.notificationResend}>
                  <Button onClick={() => onResend(n.id)} className="w-full gap-2"><Send className="h-4 w-4" /> Resend (re-queue via redrive)</Button>
                </PermissionGate>
              ) : null}

              <section>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-400">General</p>
                <dl className="space-y-1.5">
                  <Field label="Recipient" value={n.recipient || '—'} />
                  <Field label="Provider" value={n.channel === 'EMAIL' ? 'Resend' : n.channel === 'WHATSAPP' ? 'Qontak' : '—'} />
                  <Field label="Subject" value={d.rendered?.subject ?? '—'} />
                  <Field label="Created" value={dt(n.createdAt)} />
                  <Field label="Sent" value={dt(n.sentAt)} />
                  <Field label="Delivery" value={deliveryLabel(n.deliverySec)} />
                </dl>
              </section>

              {links.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Related</p>
                  <div className="flex flex-wrap gap-2">
                    {links.map((l) => (
                      <Link key={l.label} href={l.href} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-[#465fff] hover:text-[#465fff]">
                        <ExternalLink className="h-3.5 w-3.5" /> {l.label} <span className="font-mono text-gray-400">{l.id.length > 12 ? `${l.id.slice(0, 8)}…` : l.id}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Retry History</p>
                <dl className="space-y-1.5">
                  <Field label="Attempts" value={String(d.retryHistory.attempts)} />
                  <Field label="Next attempt" value={dt(d.retryHistory.nextAttemptAt)} />
                  <Field label="Locked by" value={d.retryHistory.lockedBy ?? '—'} />
                  <Field label="Last error" value={d.retryHistory.lastError ?? '—'} />
                </dl>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-gray-400">Variables / Payload</p>
                  <span className="flex gap-3">
                    <button onClick={() => copy(payloadJson)} className="inline-flex items-center gap-1 text-xs font-medium text-[#465fff]"><Copy className="h-3.5 w-3.5" /> Copy Payload</button>
                    <button onClick={download} className="inline-flex items-center gap-1 text-xs font-medium text-[#465fff]"><Download className="h-3.5 w-3.5" /> Download JSON</button>
                  </span>
                </div>
                <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{payloadJson}</pre>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-gray-400">Provider Response</p>
                  <button onClick={() => copy(responseJson)} className="inline-flex items-center gap-1 text-xs font-medium text-[#465fff]"><Copy className="h-3.5 w-3.5" /> Copy Response</button>
                </div>
                <pre className="max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{responseJson}</pre>
              </section>

              {d.rendered ? (
                <section>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Rendered Message</p>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{d.rendered.body}</pre>
                </section>
              ) : null}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Badge({ cls, children }: { cls: string; children: ReactNode }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-gray-400">{label}</dt>
      <dd className="break-all text-right font-medium text-gray-800">{value}</dd>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block text-xs uppercase text-gray-400">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'error' }) {
  const color = tone === 'error' ? 'text-red-600' : tone === 'warn' ? 'text-amber-600' : tone === 'ok' ? 'text-emerald-600' : 'text-gray-900';
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse"><div className="h-3 w-2/3 rounded bg-gray-200" /><div className="mt-2 h-6 w-1/3 rounded bg-gray-200" /></Card>
        ))}
      </div>
      <Card className="h-72 animate-pulse"><div className="h-full w-full rounded bg-gray-100" /></Card>
    </div>
  );
}
