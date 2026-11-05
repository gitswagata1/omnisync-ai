'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { Agent } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [agentId, setAgentId] = useState('');
  const [form, setForm] = useState({
    userName: '',
    role: '',
    department: 'Maintenance',
    personalPhone: '',
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ agent: Agent; token: string }>(
        '/api/agents/login',
        { agentId }
      );
      api.setToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('omnisync_agent', JSON.stringify(data.agent));
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ agent: Agent; token: string }>(
        '/api/agents',
        {
          userName: form.userName,
          role: form.role,
          department: form.department,
          personalPhone: form.personalPhone || undefined,
          permissions: ['send_messages', 'manage_schedules', 'manage_contacts'],
        }
      );
      api.setToken(data.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('omnisync_agent', JSON.stringify(data.agent));
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-2xl font-bold text-white">
            OS
          </div>
          <h1 className="mt-4 text-2xl font-bold text-zinc-100">OmniSync AI</h1>
          <p className="text-sm text-zinc-400">Enterprise WhatsApp Operating System</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex gap-2">
              <Button
                variant={mode === 'login' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => { setMode('login'); setError(''); }}
              >
                <LogIn className="mr-1.5 h-3.5 w-3.5" />
                Login
              </Button>
              <Button
                variant={mode === 'register' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => { setMode('register'); setError(''); }}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Register
              </Button>
            </div>
            <CardDescription>
              {mode === 'login'
                ? 'Enter your Agent ID to access the dashboard'
                : 'Create a new agent account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Agent ID</label>
                  <Input
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Your UUID was provided when your account was created.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                  ) : (
                    <><LogIn className="mr-2 h-4 w-4" />Sign In</>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                  ) : (
                    <><UserPlus className="mr-2 h-4 w-4" />Create Account</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600">
          OmniSync AI v0.2.0 &middot; Micro Turner Deployment
        </p>
      </div>
    </div>
  );
}
