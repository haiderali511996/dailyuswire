import { ADSENSE_CLIENT } from '@/lib/config';
import { getSiteSettings } from '@/lib/site-settings';

export const revalidate = 300;

/** Pull "pub-1234..." out of whatever was saved: "ca-pub-...", a pasted script tag, etc. */
function publisherId(value: string | undefined): string | null {
  const match = (value ?? '').match(/pub-\d{10,20}/);
  return match ? match[0] : null;
}

/**
 * /ads.txt - authorises Google to sell ads on this domain. Built from the
 * AdSense publisher ID saved in the admin panel (Settings -> Google AdSense),
 * falling back to the site's built-in ID when the admin value is blank or
 * malformed, so AdSense never sees a 404 here.
 */
export async function GET(): Promise<Response> {
  let saved = '';
  try {
    saved = (await getSiteSettings()).adsense_client;
  } catch {
    // Settings API unreachable: use the built-in ID below.
  }
  const pub = publisherId(saved) ?? publisherId(ADSENSE_CLIENT);
  if (!pub) {
    return new Response('# ads.txt: no AdSense publisher ID configured yet\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
