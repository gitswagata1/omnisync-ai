'use client';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Plus, Pause, Play, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { Schedule } from '@/lib/types';

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'default' | 'danger'> = {
  enabled: 'success',
  running: 'info',
  waiting: 'warning',
  success: 'success',
  paused: 'default',
  failed: 'danger',
  error: 'danger',
  escalated: 'danger',
  deleted: 'default',
};

const defaultForm = {
  name: '',
  scheduleType: 'maintenance_check',
  cronExpression: '0 8 * * 1-6',
  recipientPhone: '',
  body: '',
  expectedCriteria: '',
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ schedules: Schedule[] }>('/api/schedules')
      .then((d) => setSchedules(d.schedules))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => load();
    socket.on('schedule_executed', refresh);
    socket.on('schedule_response', refresh);
    return () => {
      socket.off('schedule_executed', refresh);
      socket.off('schedule_response', refresh);
    };
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/schedules', {
        name: form.name,
        scheduleType: form.scheduleType,
        cronExpression: form.cronExpression,
        recipientPhone: form.recipientPhone,
        templateVars: { body: form.body },
        expectedCriteria: form.expectedCriteria || undefined,
      });
      setForm(defaultForm);
      setShowCreate(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function handlePause(id: string) {
    try {
      await api.post(`/api/schedules/${id}/pause`, {});
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pause failed');
    }
  }

  async function handleResume(id: string) {
    try {
      await api.post(`/api/schedules/${id}/resume`, {});
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume failed');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete schedule "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/schedules/${id}`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedules</h2>
          <p className="text-sm text-zinc-400">
            {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
        </div>
      )}

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Calendar className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-400">No schedules yet. Create your first schedule to automate follow-ups.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Cron</th>
                  <th className="px-6 py-3 font-medium">Recipient</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Last Run</th>
                  <th className="px-6 py-3 font-medium">Runs</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-6 py-4 font-medium text-zinc-100">{s.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{s.scheduleType}</td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                        {s.cronExpression}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{s.recipientPhone}</td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[s.status] || 'default'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {s.lastRunAt ? (
                        <span title={formatDateTime(s.lastRunAt)}>{timeAgo(s.lastRunAt)}</span>
                      ) : (
                        <span className="text-zinc-600">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-200">{s.runCount}</span>
                      {s.errorCount > 0 && (
                        <span className="ml-1 text-red-400">({s.errorCount} err)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {s.status === 'enabled' || s.status === 'waiting' || s.status === 'success' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePause(s.id)}
                            title="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : s.status === 'paused' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResume(s.id)}
                            title="Resume"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id, s.name)}
                          title="Delete"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogTitle>Create Schedule</DialogTitle>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Name</label>
            <Input
              placeholder="Daily Maintenance Check"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Type</label>
            <Select
              value={form.scheduleType}
              onChange={(e) => setForm({ ...form, scheduleType: e.target.value })}
            >
              <option value="maintenance_check">Maintenance Check</option>
              <option value="vendor_followup">Vendor Follow-up</option>
              <option value="executive_digest">Executive Digest</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Cron Expression</label>
            <Input
              placeholder="0 8 * * 1-6"
              value={form.cronExpression}
              onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">Mon-Sat 8 AM: 0 8 * * 1-6</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Recipient Phone</label>
            <Input
              placeholder="+919876543210"
              value={form.recipientPhone}
              onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Message Body</label>
            <Input
              placeholder="Please submit today's maintenance status for Bay 1-5."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Expected Criteria <span className="text-zinc-600">(optional)</span>
            </label>
            <Input
              placeholder="Complete status for all 5 bays"
              value={form.expectedCriteria}
              onChange={(e) => setForm({ ...form, expectedCriteria: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Schedule'
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
