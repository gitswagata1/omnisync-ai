'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Users,
  Contact,
  BarChart3,
  Zap,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/schedules', label: 'Schedules', icon: Calendar },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/contacts', label: 'Contacts', icon: Contact },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/escalations', label: 'Escalations', icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-sm">
          OS
        </div>
        <div>
          <h1 className="text-sm font-bold text-zinc-100">OmniSync AI</h1>
          <p className="text-[10px] text-zinc-500">Enterprise WhatsApp OS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600/10 text-emerald-400'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
