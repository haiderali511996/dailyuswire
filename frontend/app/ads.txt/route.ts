import { getSiteSettings } from '@/lib/site-settings';

export const revalidate = 300;

/**
 * /ads.txt - authorises Google to sell ads on this domain. Built from the
 * AdSense publisher ID saved in the admin panel (Settings -> Google AdSense),
 * so it is correct the moment the ID is entered, with no redeploy.
 */
export async function GET(): Promise<Response> {
  const { adsense_client } = await getSiteSettings();
  const pub = adsense_client.trim().replace(/^ca-/, '');
  if (!/^pub-\d+$/.test(pub)) {
    return new Response('# ads.txt: no AdSense publisher ID configured yet\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response(`google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
