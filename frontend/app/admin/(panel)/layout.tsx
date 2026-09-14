import type { Metadata } from 'next';

import { AdminShell } from '@/components/admin/AdminShell';
import { ToastProvider } from '@/components/admin/Toast';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: { default: 'Newsroom', template: '%s | Newsroom' },
  robots: { index: false, follow: false, nocache: true },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdminShell>{children}</AdminShell>
      </ToastProvider>
    </AuthProvider>
  );
}
