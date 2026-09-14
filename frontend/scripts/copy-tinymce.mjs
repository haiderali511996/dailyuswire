// Self-host TinyMCE from node_modules so the editor needs no cloud API key.
import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';

const src = path.resolve('node_modules/tinymce');
const dest = path.resolve('public/tinymce');

try {
  await access(src);
} catch {
  console.log('[tinymce] package not installed yet - skipping copy.');
  process.exit(0);
}

await mkdir(path.dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log('[tinymce] assets copied to public/tinymce');
