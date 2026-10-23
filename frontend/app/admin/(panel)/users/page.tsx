'use client';

import { useCallback, useEffect, useState } from 'react';

import { MediaPicker } from '@/components/admin/MediaPicker';
import { useToast } from '@/components/admin/Toast';
import { adminApi } from '@/lib/admin-api';
import { useAuth } from '@/lib/auth-context';
import { mediaUrl } from '@/lib/config';
import type { MediaItem, Role, User } from '@/lib/types';

const BLANK = { name: '', email: '', password: '', role: 'editor' as Role, bio: '', twitter: '', linkedin: '', profile_name: '', avatar: '', is_active: true };

const ROLE_HINTS: Record<Role, string> = {
  admin: 'Full access: team, settings, everything.',
  author: 'Approves, publishes and edits any article, and manages categories.',
  editor: 'Writes their own articles and sends them to an author for approval.',
};

export default function UsersPage() {
  const { push } = useToast();
  const { user: me, can } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ ...BLANK });
  const [editing, setEditing] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listUsers()
      .then(setUsers)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  useEffect(load, [load]);

  function startEdit(user: User) {
    setEditing(user);
    setDraft({ ...BLANK, name: user.name, email: user.email, role: user.role, bio: user.bio, twitter: user.twitter, linkedin: user.linkedin || '', profile_name: user.profile_name || '', avatar: user.avatar, is_active: user.is_active });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancel() {
    setEditing(null);
    setDraft({ ...BLANK });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        const payload: Record<string, unknown> = { ...draft };
        if (!draft.password) delete payload.password;
        await adminApi.updateUser(editing.id, payload);
        push('success', 'Profile updated.');
      } else {
        await adminApi.createUser(draft);
        push('success', 'Team member added.');
      }
      cancel();
      load();
    } catch (err) {
      push('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  const isAdmin = can('admin');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Team</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Bylines shown on articles and on public author pages.
        </p>
      </div>

      {(isAdmin || editing?.id === me?.id) && (
        <form onSubmit={submit} className="card space-y-4 p-5">
          <h2 className="font-serif text-lg font-bold text-navy-900">
            {editing ? `Edit ${editing.name}` : 'Add a team member'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="u-name" className="label">Full name</label>
              <input id="u-name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" />
            </div>
            <div>
              <label htmlFor="u-email" className="label">Email</label>
              <input id="u-email" type="email" required value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="field" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="u-pass" className="label">
                Password {editing && <span className="font-normal text-ink-faint">(leave blank to keep)</span>}
              </label>
              <input
                id="u-pass"
                type="password"
                required={!editing}
                minLength={8}
                value={draft.password}
                onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                className="field"
                placeholder="At least 8 characters"
              />
            </div>
            {isAdmin && (
              <div>
                <label htmlFor="u-role" className="label">Role</label>
                <select id="u-role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })} className="field">
                  <option value="editor">Editor</option>
                  <option value="author">Author</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="hint">{ROLE_HINTS[draft.role]}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="u-bio" className="label">Bio <span className="font-normal text-ink-faint">(optional)</span></label>
            <textarea id="u-bio" rows={3} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="field resize-y" placeholder="What this writer covers and their background. Shown on every article they write." />
            <p className="hint">A real, specific bio supports E-E-A-T and helps AdSense approval.</p>
          </div>

          <div>
            <label htmlFor="u-profile-name" className="label">Name on author page <span className="font-normal text-ink-faint">(optional)</span></label>
            <input id="u-profile-name" value={draft.profile_name} onChange={(e) => setDraft({ ...draft, profile_name: e.target.value })} placeholder="e.g. your real name" className="field" />
            <p className="hint">Bylines on articles keep the Name above; the author page shows this instead.</p>
          </div>

          <div>
            <label htmlFor="u-avatar" className="label">Photo <span className="font-normal text-ink-faint">(optional)</span></label>
            <div className="flex items-center gap-3">
              {draft.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(draft.avatar)} alt="" className="h-12 w-12 shrink-0 rounded-full border border-rule object-cover" />
              )}
              <input id="u-avatar" value={draft.avatar} onChange={(e) => setDraft({ ...draft, avatar: e.target.value })} placeholder="Choose from the library or paste an image URL" className="field" />
              <button type="button" onClick={() => setPickingPhoto(true)} className="btn-ghost btn-sm shrink-0">Choose</button>
            </div>
            <p className="hint">A real headshot, shown on the author page and under every article.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="u-linkedin" className="label">LinkedIn URL <span className="font-normal text-ink-faint">(optional)</span></label>
              <input id="u-linkedin" type="url" value={draft.linkedin} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} placeholder="https://www.linkedin.com/in/your-name" className="field" />
            </div>
            <div>
              <label htmlFor="u-twitter" className="label">X / Twitter handle <span className="font-normal text-ink-faint">(optional)</span></label>
              <input id="u-twitter" value={draft.twitter} onChange={(e) => setDraft({ ...draft, twitter: e.target.value })} placeholder="@handle" className="field" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary btn-sm">
              {editing ? 'Save changes' : 'Add member'}
            </button>
            {editing && (
              <button type="button" onClick={cancel} className="btn-ghost btn-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading team...</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <li key={user.id} className="card p-4">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(user.avatar)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-800 font-serif font-bold text-white">
                    {user.name.slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy-900">{user.name}</p>
                  <p className="truncate text-xs text-ink-faint">{user.email}</p>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-2">
                <span className="rounded bg-navy-50 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-navy-800">
                  {user.role}
                </span>
                {!user.is_active && (
                  <span className="rounded bg-wash px-1.5 py-0.5 text-2xs font-bold uppercase text-ink-faint">Inactive</span>
                )}
              </p>
              {user.bio && <p className="clamp-3 mt-2 text-xs text-ink-muted">{user.bio}</p>}
              {(isAdmin || user.id === me?.id) && (
                <button type="button" onClick={() => startEdit(user)} className="btn-ghost btn-sm mt-3 w-full">
                  Edit
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <MediaPicker
        open={pickingPhoto}
        onClose={() => setPickingPhoto(false)}
        onSelect={(item: MediaItem) => setDraft((d) => ({ ...d, avatar: item.url }))}
      />
    </div>
  );
}
