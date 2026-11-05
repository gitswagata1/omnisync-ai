import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { SocketProvider } from '@/components/socket-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OmniSync AI — Enterprise Dashboard',
  description:
    'Enterprise WhatsApp multi-agent operations and executive intelligence',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <SocketProvider>
          <Sidebar />
          <div className="ml-64">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </SocketProvider>
      </body>
    </html>
  );
}
