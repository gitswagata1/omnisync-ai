'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Shield, RefreshCw, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Agent } from '@/lib/types';

const deptColors: Record<string, string> = {
  Maintenance: 'border-l-amber-500',
  Purchase: 'border-l-blue-500',
  Sales: 'border-l-emerald-500',
  Quality: 'border-l-purple-500',
  Logistics: 'border-l-cyan-500',
  Operations: 'border-l-red-500',
};

const permissions = [
  { value: 'view_all', label: 'View All Departments' },
  { value: 'send_messages', label: 'Send Messages' },
  { value: 'manage_schedules', label: 'Manage Schedules' },
  { value: 'manage_contacts', label: 'Manage Contacts' },
];

const defaultForm = {
  userName: '',
  role: '',
  department: 'Maintenance',
  personalPhone: '',
  permissions: [] as string[],
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ agents: Agent[] }>('/api/agents')
      .then((d) => setAgents(d.agents))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/agents', {
        userName: form.userName,
        role: form.role,
        department: form.department,
        personalPhone: form.personalPhone || undefined,
        permissions: form.permissions,
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

  function togglePerm(perm: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
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
          <h2 className="text-2xl font-bold">Agents</h2>
          <p className="text-sm text-zinc-400">
            {agents.length} agent{agents.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
        </div>
      )}

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Users className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-400">No agents registered yet.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className={`border-l-4 ${deptColors[agent.department] || 'border-l-zinc-500'}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">{agent.userName}</h3>
                    <p className="text-sm text-zinc-400">{agent.role}</p>
                  </div>
                  <Badge variant={agent.status === 'active' ? 'success' : 'default'}>
                    {agent.status}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Department:</span>
                    <span className="text-zinc-200">{agent.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Role Tag:</span>
                    <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-emerald-400">
                      {agent.roleTag}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-zinc-500">Since:</span>
                    <span className="text-zinc-300">{formatDate(agent.createdAt)}</span>
                  </div>
                </div>

                {agent.permissions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {agent.permissions.map((p) => (
                      <Badge key={p} variant="info" className="text-[10px]">
                        <Shield className="mr-1 h-2.5 w-2.5" />
                        {p.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogTitle>Add Agent</DialogTitle>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Name</label>
            <Input
              placeholder="Swagata"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Role</label>
            <Input
              placeholder="Purchase Manager"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Department</label>
            <Select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="Maintenance">Maintenance</option>
              <option value="Purchase">Purchase</option>
              <option value="Sales">Sales</option>
              <option value="Quality">Quality</option>
              <option value="Logistics">Logistics</option>
              <option value="Operations">Operations</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Phone <span className="text-zinc-600">(optional)</span>
            </label>
            <Input
              placeholder="+919876543210"
              value={form.personalPhone}
              onChange={(e) => setForm({ ...form, personalPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Permissions</label>
            <div className="space-y-2">
              {permissions.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p.value)}
                    onChange={() => togglePerm(p.value)}
                    className="rounded border-zinc-600 bg-zinc-800 text-emerald-600 focus:ring-emerald-500"
                  />
                  {p.label}
                </label>
              ))}
            </div>
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
                'Add Agent'
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
