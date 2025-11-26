import type { Metadata } from 'next';
import './globals.css';
import { WindowManagerProvider } from '@/context/WindowManagerContext';

export const metadata: Metadata = {
  title: 'OvertimeOS',
  description: 'Fake OS puzzle about unpaid overtime',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <WindowManagerProvider>{children}</WindowManagerProvider>
      </body>
    </html>
  );
}
