'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { adminApi } from '@/lib/admin-api';
import { SITE_NAME } from '@/lib/config';

const MIN_LENGTH = 8;

function ResetForm() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { detail } = await adminApi.resetPassword(token, password);
      setDone(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="card space-y-4 p-6">
        <p role="alert" className="rounded-md border border-flag-200 bg-flag-50 px-3 py-2 text-sm text-flag-900">
          This reset link is incomplete. Open the link from your email again, or request a new one.
        </p>
        <Link href="/admin/forgot-password" className="btn-primary w-full">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card space-y-4 p-6">
        <p role="status" className="rounded-md border border-rule bg-wash px-3 py-2 text-sm text-ink">
          {done}
        </p>
        <Link href="/admin/login" className="btn-primary w-full">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      {error && (
        <div role="alert" className="rounded-md border border-flag-200 bg-flag-50 px-3 py-2 text-sm text-flag-900">
          <p>{error}</p>
          {error.includes('expired') && (
            <Link href="/admin/forgot-password" className="mt-1 inline-block font-semibold underline">
              Request a new link
            </Link>
          )}
        </div>
      )}

      <div>
        <label htmlFor="password" className="label">
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          placeholder="At least 8 characters"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="label">
          Confirm new password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_LENGTH}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="field"
        />
      </div>

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? 'Saving...' : 'Update password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-wash px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Image src="/logo.png" alt={SITE_NAME} width={220} height={51} priority className="mx-auto h-auto w-52" />
          </Link>
          <h1 className="mt-6 font-serif text-2xl font-bold text-navy-900">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-muted">Choose a new password for your newsroom account.</p>
        </div>

        <Suspense fallback={<div className="card p-6 text-sm text-ink-muted">Loading...</div>}>
          <ResetForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-ink-faint">
          <Link href="/admin/login" className="hover:text-navy-800 hover:underline">
            &larr; Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
