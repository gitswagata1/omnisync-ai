'use client';

import { useEffect, useState, useCallback } from 'react';
import { Contact, Plus, Search, RefreshCw, MessageSquare, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { cn, timeAgo } from '@/lib/utils';
import type { Contact as ContactType, Message, Schedule, Escalation } from '@/lib/types';

interface ContactContext {
  contact: ContactType;
  messages: Message[];
  schedules: Schedule[];
  escalations: Escalation[];
}

const defaultForm = {
  name: '',
  phone: '',
  company: '',
  departments: '',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [context, setContext] = useState<ContactContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ contacts: ContactType[] }>('/api/contacts')
      .then((d) => setContacts(d.contacts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function selectContact(id: string) {
    setSelectedId(id);
    setContextLoading(true);
    try {
      const data = await api.get<ContactContext>(`/api/contacts/${id}/context`);
      setContext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load context');
    } finally {
      setContextLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/contacts', {
        name: form.name,
        phone: form.phone,
        company: form.company,
        departments: form.departments.split(',').map((d) => d.trim()).filter(Boolean),
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

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

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
          <h2 className="text-2xl font-bold">Contacts</h2>
          <p className="text-sm text-zinc-400">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in system
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left panel — contact list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search contacts..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <Contact className="h-10 w-10 text-zinc-600" />
                <p className="text-sm text-zinc-400">
                  {search ? 'No contacts match your search.' : 'No contacts yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectContact(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors',
                    selectedId === c.id
                      ? 'border-emerald-700 bg-emerald-900/10'
                      : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50'
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{c.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{c.company} &middot; {c.phone}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.departments.map((d) => (
                        <Badge key={d} variant="default" className="text-[10px]">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right panel — contact context */}
        <div className="lg:col-span-3">
          {!selectedId ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-20">
                <Contact className="h-12 w-12 text-zinc-600" />
                <p className="text-zinc-400">Select a contact to view their context card</p>
              </CardContent>
            </Card>
          ) : contextLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
              </CardContent>
            </Card>
          ) : context ? (
            <div className="space-y-4">
              {/* Contact header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/30 text-xl font-bold text-emerald-400">
                      {context.contact.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-100">{context.contact.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {context.contact.company} &middot; {context.contact.phone}
                      </p>
                      <div className="mt-1 flex gap-1">
                        {context.contact.departments.map((d) => (
                          <Badge key={d} variant="info">{d}</Badge>
                        ))}
                        <Badge variant={context.contact.status === 'active' ? 'success' : 'default'}>
                          {context.contact.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Context Vector */}
              {Object.keys(context.contact.contextVector).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contact Context Vector</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(context.contact.contextVector).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-zinc-400">{key}</span>
                          <span className="text-zinc-200">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Recent Messages ({context.messages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {context.messages.length === 0 ? (
                    <p className="text-sm text-zinc-500">No messages yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {context.messages.slice(0, 20).map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'rounded-lg p-3 text-sm',
                            msg.direction === 'inbound'
                              ? 'bg-zinc-800 mr-8'
                              : 'bg-emerald-900/20 ml-8'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge
                              variant={msg.direction === 'inbound' ? 'default' : 'success'}
                              className="text-[10px]"
                            >
                              {msg.direction}
                            </Badge>
                            {msg.roleTag && (
                              <span className="text-[10px] text-emerald-400">{msg.roleTag}</span>
                            )}
                          </div>
                          <p className="text-zinc-200">{msg.body}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">{timeAgo(msg.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Schedules */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Schedules ({context.schedules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {context.schedules.length === 0 ? (
                    <p className="text-sm text-zinc-500">No schedules for this contact.</p>
                  ) : (
                    <div className="space-y-2">
                      {context.schedules.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3 text-sm">
                          <div>
                            <p className="font-medium text-zinc-200">{s.name}</p>
                            <code className="text-[10px] text-zinc-500">{s.cronExpression}</code>
                          </div>
                          <Badge variant={s.status === 'enabled' ? 'success' : 'default'}>
                            {s.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Escalation History */}
              {context.escalations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Escalations ({context.escalations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {context.escalations.map((esc) => (
                        <div key={esc.id} className="rounded-lg border-l-2 border-l-red-500 bg-zinc-800/50 p-3 text-sm">
                          <p className="text-zinc-200">{esc.reason}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant={esc.status === 'active' ? 'danger' : 'success'}>
                              {esc.status}
                            </Badge>
                            <span className="text-[10px] text-zinc-500">{timeAgo(esc.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <DialogTitle>Add Contact</DialogTitle>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Name</label>
            <Input
              placeholder="Mercedes-Benz India"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Phone</label>
            <Input
              placeholder="+919876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Company</label>
            <Input
              placeholder="Mercedes-Benz"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Departments (comma-separated)</label>
            <Input
              placeholder="Purchase, Sales, Quality"
              value={form.departments}
              onChange={(e) => setForm({ ...form, departments: e.target.value })}
              required
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
                'Add Contact'
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
