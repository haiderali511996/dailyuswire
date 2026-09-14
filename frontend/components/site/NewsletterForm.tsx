'use client';

import { useState } from 'react';

import { API_URL } from '@/lib/config';

export function NewsletterForm({ className = '' }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail ?? 'Subscription failed');
      setState('done');
      setMessage(body.detail ?? 'You are subscribed.');
      setEmail('');
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (state === 'done') {
    return (
      <p className={`rounded-md bg-white/10 p-3 text-sm text-white ${className}`} role="status">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={`space-y-2 ${className}`}>
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-navy-300 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="h-10 w-full rounded-md bg-flag-600 text-sm font-semibold text-white transition hover:bg-flag-700 disabled:opacity-60"
      >
        {state === 'sending' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {state === 'error' && (
        <p role="alert" className="text-xs text-flag-200">
          {message}
        </p>
      )}
    </form>
  );
}
