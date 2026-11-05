'use client';

import { useEffect, useState } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { Badge } from './ui/badge';

export function Header() {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onEvent = () => setNotifications((n) => n + 1);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('schedule_error', onEvent);
    socket.on('schedule_executed', onEvent);

    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('schedule_error', onEvent);
      socket.off('schedule_executed', onEvent);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-sm">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {connected ? (
            <Badge variant="success" className="flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Live
            </Badge>
          ) : (
            <Badge variant="danger" className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
        <button
          className="relative rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          onClick={() => setNotifications(0)}
        >
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
