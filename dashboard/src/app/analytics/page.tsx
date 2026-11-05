'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  MessageSquare,
  CalendarClock,
  Clock,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import type { DashboardMetrics, Schedule } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type DigestPeriod = 'daily' | 'weekly' | 'monthly';

interface DigestData {
  digest: string;
  generatedAt?: string;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activePeriod, setActivePeriod] = useState<DigestPeriod>('daily');
  const [digests, setDigests] = useState<Record<DigestPeriod, DigestData | null>>({
    daily: null,
    weekly: null,
    monthly: null,
  });
  const [loadingDigest, setLoadingDigest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadMetrics(), loadSchedules(), fetchDigest('daily')]).finally(() =>
      setLoading(false)
    );
  }, []);

  async function loadMetrics() {
    try {
      const data = await api.get<{ metrics: DashboardMetrics }>('/api/analytics/dashboard');
      setMetrics(data.metrics);
    } catch {
      // fall through
    }
  }

  async function loadSchedules() {
    try {
      const data = await api.get<{ schedules: Schedule[] }>('/api/schedules');
      setSchedules(data.schedules);
    } catch {
      // fall through
    }
  }

  async function fetchDigest(period: DigestPeriod) {
    setLoadingDigest(true);
    try {
      const data = await api.get<DigestData>(`/api/analytics/digest/${period}`);
      setDigests((prev) => ({
        ...prev,
        [period]: { ...data, generatedAt: data.generatedAt || new Date().toISOString() },
      }));
    } catch {
      setDigests((prev) => ({
        ...prev,
        [period]: { digest: 'No digest available for this period.', generatedAt: new Date().toISOString() },
      }));
    } finally {
      setLoadingDigest(false);
    }
  }

  function handleTabChange(period: DigestPeriod) {
    setActivePeriod(period);
    if (!digests[period]) {
      fetchDigest(period);
    }
  }

  function responseTimeColor(avg: number): string {
    if (avg < 2) return 'text-emerald-400';
    if (avg < 4) return 'text-amber-400';
    return 'text-red-400';
  }

  function successRate(s: Schedule): number {
    if (s.runCount === 0) return 100;
    return Math.round(((s.runCount - s.errorCount) / s.runCount) * 100);
  }

  function rateColor(rate: number): string {
    if (rate >= 90) return 'text-emerald-400';
    if (rate >= 70) return 'text-amber-400';
    return 'text-red-400';
  }

  const sortedSchedules = [...schedules].sort((a, b) => b.runCount - a.runCount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-pulse text-zinc-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            Analytics & Digests
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Executive intelligence dashboard</p>
        </div>
      </div>

      {/* Digest Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Executive Digests</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDigest(activePeriod)}
              disabled={loadingDigest}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loadingDigest && 'animate-spin')} />
              Generate
            </Button>
          </div>
          <div className="flex gap-1 mt-3">
            {(['daily', 'weekly', 'monthly'] as DigestPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => handleTabChange(period)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activePeriod === period
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                )}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loadingDigest ? (
            <div className="animate-pulse text-zinc-500 py-8 text-center">Generating digest...</div>
          ) : digests[activePeriod] ? (
            <div className="space-y-3">
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/40">
                {digests[activePeriod]!.digest.split('\n').map((line, i) => {
                  if (!line.trim()) return <br key={i} />;
                  const isBold = line.startsWith('**') || line.startsWith('#') || line.startsWith('*');
                  return (
                    <p
                      key={i}
                      className={cn(
                        'text-sm leading-relaxed',
                        isBold ? 'text-zinc-100 font-semibold mt-3' : 'text-zinc-300'
                      )}
                    >
                      {line.replace(/^[#*]+\s*/, '').replace(/\*\*/g, '')}
                    </p>
                  );
                })}
              </div>
              {digests[activePeriod]!.generatedAt && (
                <p className="text-[10px] text-zinc-600">
                  Generated: {formatDateTime(digests[activePeriod]!.generatedAt!)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 py-8 text-center text-sm">
              No digest available. Click Generate to create one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Messages Today</p>
                <p className="text-3xl font-bold text-zinc-100 mt-1">{metrics?.messagesToday ?? 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(((metrics?.messagesToday ?? 0) / 100) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">{metrics?.messagesThisWeek ?? 0} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Active Schedules</p>
                <p className="text-3xl font-bold text-zinc-100 mt-1">{metrics?.activeSchedules ?? 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-900/30 flex items-center justify-center">
                <CalendarClock className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              {metrics?.schedulesRunToday ?? 0} run today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Avg Response Time</p>
                <p className={cn('text-3xl font-bold mt-1', responseTimeColor(metrics?.avgResponseTime ?? 0))}>
                  {(metrics?.avgResponseTime ?? 0).toFixed(1)}h
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              {(metrics?.avgResponseTime ?? 0) < 2 ? 'Within target' : 'Above target (2h)'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pending Escalations</p>
                <p className={cn(
                  'text-3xl font-bold mt-1',
                  (metrics?.pendingEscalations ?? 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                )}>
                  {metrics?.pendingEscalations ?? 0}
                </p>
              </div>
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center',
                (metrics?.pendingEscalations ?? 0) > 0 ? 'bg-red-900/30' : 'bg-emerald-900/30'
              )}>
                {(metrics?.pendingEscalations ?? 0) > 0 ? (
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              {(metrics?.pendingEscalations ?? 0) === 0 ? 'All clear' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Schedule Performance
          </CardTitle>
          <CardDescription>All schedules sorted by run count</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedSchedules.length === 0 ? (
            <p className="text-zinc-500 text-sm py-6 text-center">No schedules found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-2 text-zinc-500 font-medium text-xs uppercase">Schedule</th>
                    <th className="text-left py-3 px-2 text-zinc-500 font-medium text-xs uppercase">Type</th>
                    <th className="text-right py-3 px-2 text-zinc-500 font-medium text-xs uppercase">Runs</th>
                    <th className="text-right py-3 px-2 text-zinc-500 font-medium text-xs uppercase">Errors</th>
                    <th className="text-right py-3 px-2 text-zinc-500 font-medium text-xs uppercase">Success</th>
                    <th className="text-center py-3 px-2 text-zinc-500 font-medium text-xs uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSchedules.map((s) => {
                    const rate = successRate(s);
                    return (
                      <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-2 text-zinc-200 font-medium">{s.name}</td>
                        <td className="py-3 px-2">
                          <Badge variant="outline">{s.scheduleType}</Badge>
                        </td>
                        <td className="py-3 px-2 text-right text-zinc-300 tabular-nums">{s.runCount}</td>
                        <td className="py-3 px-2 text-right tabular-nums">
                          <span className={s.errorCount > 0 ? 'text-red-400' : 'text-zinc-500'}>
                            {s.errorCount}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right tabular-nums">
                          <span className={rateColor(rate)}>{rate}%</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge
                            variant={
                              s.status === 'enabled' ? 'success'
                                : s.status === 'paused' ? 'warning'
                                  : s.status === 'escalated' ? 'danger'
                                    : 'default'
                            }
                          >
                            {s.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
