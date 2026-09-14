'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { adminApi } from '@/lib/admin-api';
import { mediaUrl } from '@/lib/config';
import { formatBytes } from '@/lib/format';
import type { MediaItem } from '@/lib/types';

import { useToast } from './Toast';

/** Modal library + uploader. Used for covers, gallery images and the editor. */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  title = 'Choose an image',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  title?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listMedia()
      .then(setItems)
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [push]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy-950/60 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl bg-white shadow-pop sm:rounded-xl"
      >
        <header className="flex items-center justify-between border-b border-rule px-5 py-3.5">
          <h2 className="font-serif text-lg font-bold text-navy-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1.5 text-ink-muted hover:bg-wash">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="border-b border-rule p-4">
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
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
              dragging ? 'border-navy-800 bg-navy-50' : 'border-rule bg-wash'
            }`}
          >
            <p className="text-sm text-ink-muted">
              Drag images here, or{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-navy-800 underline"
              >
                browse your device
              </button>
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              JPG, PNG, WebP or GIF. Converted to WebP and resized automatically.
            </p>
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
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-ink-muted">Loading library...</p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">No images yet - upload your first one above.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                    className="group block w-full overflow-hidden rounded-md border border-rule text-left transition hover:border-navy-800 hover:shadow-card"
                  >
                    <span className="relative block aspect-[4/3] w-full bg-wash">
                      <Image
                        src={mediaUrl(item.thumb_url || item.url)}
                        alt={item.alt || item.filename}
                        fill
                        sizes="200px"
                        className="object-cover transition group-hover:scale-105"
                      />
                    </span>
                    <span className="block px-2 py-1.5">
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
        </div>
      </div>
    </div>
  );
}
