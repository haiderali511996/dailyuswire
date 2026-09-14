'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useToast } from '@/components/admin/Toast';
import { adminApi } from '@/lib/admin-api';
import { mediaUrl } from '@/lib/config';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { MediaItem } from '@/lib/types';

export default function MediaPage() {
  const { push } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<MediaItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listMedia()
      .then(setItems)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  useEffect(load, [load]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      try {
        const uploaded: MediaItem[] = [];
        for (const file of Array.from(files)) {
          uploaded.push(await adminApi.uploadMedia(file, file.name.replace(/\.[^.]+$/, '')));
        }
        setItems((prev) => [...uploaded, ...prev]);
        push('success', `Uploaded ${uploaded.length} image${uploaded.length === 1 ? '' : 's'}`);
      } catch (e) {
        push('error', e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [push],
  );

  async function remove(item: MediaItem) {
    if (!window.confirm(`Delete ${item.filename}? Articles using it will show a broken image.`)) return;
    try {
      await adminApi.deleteMedia(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setActive(null);
      push('success', 'Image deleted.');
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-navy-900">Media library</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Uploads are auto-converted to WebP, resized to 1600px and given a 480px thumbnail.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition ${
          dragging ? 'border-navy-800 bg-navy-50' : 'border-rule bg-white'
        }`}
      >
        <p className="text-sm text-ink-muted">
          Drag images anywhere here, or{' '}
          <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-navy-800 underline">
            browse your device
          </button>
        </p>
        <p className="mt-1 text-xs text-ink-faint">JPG, PNG, WebP, GIF or AVIF, up to 10MB each.</p>
        {uploading && <p className="mt-2 text-xs font-semibold text-navy-800">Uploading...</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading library...</p>
      ) : items.length === 0 ? (
        <p className="card p-10 text-center text-sm text-ink-muted">Nothing uploaded yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActive(item)}
                className="group block w-full overflow-hidden rounded-lg border border-rule bg-white text-left transition hover:border-navy-800 hover:shadow-card"
              >
                <span className="relative block aspect-[4/3] w-full bg-wash">
                  <Image
                    src={mediaUrl(item.thumb_url || item.url)}
                    alt={item.alt || item.filename}
                    fill
                    sizes="240px"
                    className="object-cover transition group-hover:scale-105"
                  />
                </span>
                <span className="block px-2.5 py-2">
                  <span className="block truncate text-xs font-medium text-navy-900">{item.filename}</span>
                  <span className="block text-2xs text-ink-faint">
                    {item.width}&times;{item.height} · {formatBytes(item.size_bytes)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-950/60 p-4" onClick={() => setActive(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={active.filename}
            className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-wash">
              <Image src={mediaUrl(active.url)} alt={active.alt || active.filename} fill sizes="640px" className="object-contain" />
            </div>
            <div className="space-y-2 p-5">
              <p className="font-serif text-lg font-bold text-navy-900">{active.filename}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink-muted">
                <div>
                  <dt className="inline font-medium">Size: </dt>
                  <dd className="inline">{formatBytes(active.size_bytes)}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Dimensions: </dt>
                  <dd className="inline">
                    {active.width}&times;{active.height}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="inline font-medium">Uploaded: </dt>
                  <dd className="inline">{formatDateTime(active.created_at)}</dd>
                </div>
              </dl>
              <label className="label !mt-3" htmlFor="media-url">
                URL
              </label>
              <input id="media-url" readOnly value={mediaUrl(active.url)} className="field font-mono text-xs" onFocus={(e) => e.target.select()} />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mediaUrl(active.url)).catch(() => {});
                    push('success', 'URL copied.');
                  }}
                  className="btn-ghost btn-sm flex-1"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => remove(active)}
                  className="btn-sm rounded-md border border-flag-200 px-3 text-flag-700 hover:bg-flag-50"
                >
                  Delete
                </button>
                <button type="button" onClick={() => setActive(null)} className="btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
