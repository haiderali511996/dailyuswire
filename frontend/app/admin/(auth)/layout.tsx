import type { Metadata } from 'next';

import { ToastProvider } from '@/components/admin/Toast';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Sign in to the Newsroom',
  robots: { index: false, follow: false, nocache: true },
};

/** Sits outside AdminShell so the login page never redirect-loops. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}
