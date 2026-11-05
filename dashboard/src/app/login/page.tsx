'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setPassword('');
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
            <CardDescription>Sign in with your agent email and password</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" />Sign In</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600">
          OmniSync AI v0.2.0 &middot; Micro Turner Deployment
        </p>
      </div>
    </div>
  );
}
