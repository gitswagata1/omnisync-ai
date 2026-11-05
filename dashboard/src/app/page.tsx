'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Calendar,
  AlertTriangle,
  Clock,
  TrendingUp,
  Play,
  CheckCircle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { timeAgo } from '@/lib/utils';
import type { DashboardMetrics } from '@/lib/types';

interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
}

const statCards = [
  { key: 'messagesToday', label: 'Messages Today', icon: MessageSquare, color: 'text-blue-400' },
  { key: 'activeSchedules', label: 'Active Schedules', icon: Calendar, color: 'text-emerald-400' },
  { key: 'pendingEscalations', label: 'Pending Escalations', icon: AlertTriangle, color: 'text-red-400' },
  { key: 'avgResponseTime', label: 'Avg Response (hrs)', icon: Clock, color: 'text-amber-400' },
  { key: 'messagesThisWeek', label: 'Messages This Week', icon: TrendingUp, color: 'text-purple-400' },
  { key: 'schedulesRunToday', label: 'Schedules Run Today', icon: Play, color: 'text-cyan-400' },
] as const;

interface DashboardApiResponse {
  messages?: { total?: number };
  schedules?: Record<string, number>;
  escalations?: { pending?: number };
  performance?: { scheduledExecutionsToday?: number; avgResponseTimeMinutes?: number | null };
}

function toDashboardMetrics(data: DashboardApiResponse): DashboardMetrics {
  return {
    messagesToday: data.messages?.total ?? 0,
    activeSchedules: data.schedules?.enabled ?? 0,
    pendingEscalations: data.escalations?.pending ?? 0,
    avgResponseTime: (data.performance?.avgResponseTimeMinutes ?? 0) / 60,
    // Not provided by the API yet.
    messagesThisWeek: 0,
    schedulesRunToday: data.performance?.scheduledExecutionsToday ?? 0,
  };
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // The API returns a nested shape (messages / schedules / escalations /
    // performance / totals); map it onto the flat DashboardMetrics this page uses.
    api
      .get<DashboardApiResponse>('/api/analytics/dashboard')
      .then((data) => setMetrics(toDashboardMetrics(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const addEvent = (evt: ActivityEvent) => {
      setActivity((prev) => [evt, ...prev].slice(0, 50));
    };

    socket.on('schedule_executed', (data: { scheduleName: string; timestamp: string }) => {
      addEvent({
        id: crypto.randomUUID(),
        type: 'schedule_executed',
        message: `Schedule "${data.scheduleName}" executed`,
        timestamp: data.timestamp,
        variant: 'success',
      });
    });

    socket.on('schedule_response', (data: { scheduleName: string; decision: string; timestamp: string }) => {
      addEvent({
        id: crypto.randomUUID(),
        type: 'schedule_response',
        message: `Response for "${data.scheduleName}": ${data.decision}`,
        timestamp: data.timestamp,
        variant: data.decision === 'ACCEPT' ? 'success' : data.decision === 'CLARIFY' ? 'warning' : 'danger',
      });
    });

    socket.on('schedule_error', (data: { scheduleName: string; error: string; timestamp: string }) => {
      addEvent({
        id: crypto.randomUUID(),
        type: 'schedule_error',
        message: `Error in "${data.scheduleName}": ${data.error}`,
        timestamp: data.timestamp,
        variant: 'danger',
      });
    });

    socket.on('message_inbound', (data: { contactName: string; timestamp: string }) => {
      addEvent({
        id: crypto.randomUUID(),
        type: 'message_inbound',
        message: `Inbound message from ${data.contactName}`,
        timestamp: data.timestamp,
        variant: 'info',
      });
    });

    socket.on('message_outbound', (data: { contactName: string; agentName: string; timestamp: string }) => {
      addEvent({
        id: crypto.randomUUID(),
        type: 'message_outbound',
        message: `${data.agentName} sent message to ${data.contactName}`,
        timestamp: data.timestamp,
        variant: 'info',
      });
    });

    return () => {
      socket.off('schedule_executed');
      socket.off('schedule_response');
      socket.off('schedule_error');
      socket.off('message_inbound');
      socket.off('message_outbound');
    };
  }, []);

  const eventIcon = (type: string) => {
    switch (type) {
      case 'schedule_executed': return <Play className="h-4 w-4" />;
      case 'schedule_response': return <CheckCircle className="h-4 w-4" />;
      case 'schedule_error': return <XCircle className="h-4 w-4" />;
      case 'message_inbound': return <ArrowDownLeft className="h-4 w-4" />;
      case 'message_outbound': return <ArrowUpRight className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-400">
        Failed to load dashboard: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-zinc-400">Real-time operational overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const value = metrics ? metrics[stat.key] : 0;
          const display = stat.key === 'avgResponseTime' ? value.toFixed(1) : value;
          return (
            <Card key={stat.key}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg bg-zinc-800 p-3 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{display}</p>
                  <p className="text-xs text-zinc-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No activity yet. Events will appear here in real-time as schedules execute and messages flow.
            </p>
          ) : (
            <div className="space-y-3">
              {activity.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3"
                >
                  <div
                    className={
                      evt.variant === 'success'
                        ? 'text-emerald-400'
                        : evt.variant === 'warning'
                          ? 'text-amber-400'
                          : evt.variant === 'danger'
                            ? 'text-red-400'
                            : 'text-blue-400'
                    }
                  >
                    {eventIcon(evt.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200">{evt.message}</p>
                    <p className="text-xs text-zinc-500">{timeAgo(evt.timestamp)}</p>
                  </div>
                  <Badge variant={evt.variant} className="shrink-0">
                    {evt.type.replace('schedule_', '').replace('message_', '')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
