'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth-context';
import { SITE_NAME } from '@/lib/config';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/admin');
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-wash px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt={SITE_NAME} width={220} height={51} priority className="mx-auto h-auto w-52" />
          </Link>
          <h1 className="mt-6 font-serif text-2xl font-bold text-navy-900">Sign in to the Newsroom</h1>
          <p className="mt-1 text-sm text-ink-muted">Write, edit and publish your newsroom&apos;s articles.</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          {error && (
            <p role="alert" className="rounded-md border border-flag-200 bg-flag-50 px-3 py-2 text-sm text-flag-900">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@dailyuswire.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-faint">
          <Link href="/" className="hover:text-navy-800 hover:underline">
            &larr; Back to the live site
          </Link>
        </p>
      </div>
    </div>
  );
}
