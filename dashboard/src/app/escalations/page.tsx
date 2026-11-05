'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Eye,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';
import type { Schedule } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type FilterType = 'all' | 'active' | 'resolved';

interface EscalationItem {
  id: string;
  scheduleId: string;
  scheduleName: string;
  reason: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
}

interface OverdueSchedule {
  id: string;
  name: string;
  lastRunAt: string;
  overdueBy: string;
  recipientPhone: string;
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [overdueSchedules, setOverdueSchedules] = useState<OverdueSchedule[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const socket = connectSocket();

    socket.on('schedule_error', (data: { scheduleId: string; scheduleName: string; error: string }) => {
      const newEsc: EscalationItem = {
        id: `esc-${Date.now()}`,
        scheduleId: data.scheduleId,
        scheduleName: data.scheduleName,
        reason: data.error || 'Schedule execution failed',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setEscalations((prev) => [newEsc, ...prev]);
    });

    return () => {
      socket.off('schedule_error');
    };
  }, []);

  async function loadData() {
    try {
      const data = await api.get<{ schedules: Schedule[] }>('/api/schedules');
      const scheds = data.schedules;

      const escalated = scheds
        .filter((s) => s.status === 'escalated')
        .map((s): EscalationItem => ({
          id: `esc-${s.id}`,
          scheduleId: s.id,
          scheduleName: s.name,
          reason: 'No response received within timeout period',
          status: 'active',
          createdAt: s.lastRunAt || s.createdAt,
        }));
      setEscalations(escalated);

      const twoHoursMs = 2 * 60 * 60 * 1000;
      const now = Date.now();
      const overdue = scheds
        .filter((s) => s.status === 'waiting' && s.lastRunAt)
        .filter((s) => now - new Date(s.lastRunAt!).getTime() > twoHoursMs)
        .map((s): OverdueSchedule => {
          const overdueMs = now - new Date(s.lastRunAt!).getTime() - twoHoursMs;
          const hours = Math.floor(overdueMs / (60 * 60 * 1000));
          const mins = Math.floor((overdueMs % (60 * 60 * 1000)) / (60 * 1000));
          return {
            id: s.id,
            name: s.name,
            lastRunAt: s.lastRunAt!,
            overdueBy: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
            recipientPhone: s.recipientPhone,
          };
        });
      setOverdueSchedules(overdue);
    } catch {
      // fall through
    } finally {
      setLoading(false);
    }
  }

  function handleAcknowledge(id: string) {
    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'acknowledged' as const } : e))
    );
  }

  function handleResolve(id: string) {
    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'resolved' as const } : e))
    );
  }

  const filtered = escalations.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'active') return e.status === 'active' || e.status === 'acknowledged';
    return e.status === 'resolved';
  });

  const activeCount = escalations.filter((e) => e.status === 'active' || e.status === 'acknowledged').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-pulse text-zinc-400">Loading escalations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Escalation Tracker
            {activeCount > 0 && (
              <Badge variant="danger" className="ml-2 text-sm px-3 py-1">
                {activeCount} Active
              </Badge>
            )}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Monitor and resolve escalated items</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-500" />
        {(['all', 'active', 'resolved'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === f
                ? f === 'active'
                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                  : f === 'resolved'
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                    : 'bg-zinc-700 text-zinc-200'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'active' && activeCount > 0 && ` (${activeCount})`}
          </button>
        ))}
      </div>

      {/* Escalation List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-lg font-medium">No escalations</p>
              <p className="text-zinc-600 text-sm mt-1">
                {filter === 'all'
                  ? 'All schedules are operating normally'
                  : filter === 'active'
                    ? 'No active escalations — all clear'
                    : 'No resolved escalations yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((esc) => (
            <Card
              key={esc.id}
              className={cn(
                'border-l-4 transition-all',
                esc.status === 'active' && 'border-l-red-500',
                esc.status === 'acknowledged' && 'border-l-amber-500',
                esc.status === 'resolved' && 'border-l-emerald-500'
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      esc.status === 'active' && 'bg-red-900/30',
                      esc.status === 'acknowledged' && 'bg-amber-900/30',
                      esc.status === 'resolved' && 'bg-emerald-900/30'
                    )}>
                      {esc.status === 'resolved' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : esc.status === 'acknowledged' ? (
                        <Eye className="h-5 w-5 text-amber-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-zinc-100">{esc.scheduleName}</h3>
                        <Badge
                          variant={
                            esc.status === 'active' ? 'danger'
                              : esc.status === 'acknowledged' ? 'warning'
                                : 'success'
                          }
                        >
                          {esc.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">{esc.reason}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(esc.createdAt)}
                        </span>
                        <span>{formatDateTime(esc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {esc.status !== 'resolved' && (
                    <div className="flex gap-2 flex-shrink-0">
                      {esc.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledge(esc.id)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleResolve(esc.id)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Overdue Schedules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Overdue Schedules
          </CardTitle>
          <CardDescription>
            Schedules waiting for responses beyond the 2-hour threshold
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overdueSchedules.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No overdue schedules — all responses within threshold</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueSchedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-900/10 border border-amber-900/30"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                      <p className="text-xs text-zinc-500">
                        Sent: {formatDateTime(s.lastRunAt)} · To: {s.recipientPhone}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning">Overdue by {s.overdueBy}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
