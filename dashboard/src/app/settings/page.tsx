'use client';

import { useState } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem('omnisync_api_url') || 'http://localhost:3000'
      : 'http://localhost:3000'
  );
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('omnisync_api_url', apiUrl);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-zinc-400">Configure your dashboard</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Connection</CardTitle>
          <CardDescription>Configure the backend API endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Backend API URL</label>
            <div className="flex gap-3">
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
              <Button onClick={handleSave}>
                {saved ? (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Changes take effect after page reload.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Platform</span>
              <Badge variant="info">OmniSync AI</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Version</span>
              <span className="text-zinc-200">0.1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Dashboard</span>
              <span className="text-zinc-200">Next.js 16</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Backend</span>
              <span className="text-zinc-200">Express + TypeScript</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">WhatsApp API</span>
              <span className="text-zinc-200">Cloud API v21.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">LLM</span>
              <span className="text-zinc-200">GPT-4o via OpenAI</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
