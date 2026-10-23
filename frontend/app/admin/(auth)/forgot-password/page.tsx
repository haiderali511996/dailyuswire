'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { adminApi } from '@/lib/admin-api';
import { SITE_NAME } from '@/lib/config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { detail } = await adminApi.forgotPassword(email);
      setSent(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset link');
    } finally {
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
          <h1 className="mt-6 font-serif text-2xl font-bold text-navy-900">Forgot your password?</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Enter your account email and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="card space-y-4 p-6">
            <p role="status" className="rounded-md border border-rule bg-wash px-3 py-2 text-sm text-ink">
              {sent}
            </p>
            <p className="text-sm text-ink-muted">The link expires in 30 minutes and works once.</p>
            <button type="button" onClick={() => setSent('')} className="btn-ghost w-full">
              Send another link
            </button>
          </div>
        ) : (
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

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink-faint">
          <Link href="/admin/login" className="hover:text-navy-800 hover:underline">
            &larr; Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
