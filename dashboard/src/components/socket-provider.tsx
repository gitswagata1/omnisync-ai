'use client';

import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  return <>{children}</>;
}
