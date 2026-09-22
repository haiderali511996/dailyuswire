import {
  ADSENSE_CLIENT,
  API_INTERNAL,
  GA_ID,
  GSC_VERIFICATION,
  SITE_NAME,
  SITE_TAGLINE,
  TWITTER_HANDLE,
} from './config';

/**
 * Values the admin panel's Settings page controls on the public site.
 *
 * Every field falls back to the build-time NEXT_PUBLIC_* variable, so a site
 * deployed before the admin field was filled in keeps working, and an editor
 * can later take over without a redeploy. A blank admin field means "use the
 * environment value"; a filled one wins.
 */
export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  adsense_client: string;
  adsense_slot_header: string;
  adsense_slot_in_feed: string;
  adsense_slot_in_article: string;
  adsense_slot_sidebar: string;
  adsense_slot_sidebar_2: string;
  adsense_slot_footer: string;
  adsense_auto_ads: string;
  ga_measurement_id: string;
  gsc_verification: string;
  twitter_handle: string;
  facebook_url: string;
  youtube_url: string;
}

export type AdSlotName = 'header' | 'in_feed' | 'in_article' | 'sidebar' | 'sidebar_2' | 'footer';

const ENV_SLOTS: Record<AdSlotName, string | undefined> = {
  // Literal property access only: Next inlines these at build time.
  header: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER,
  in_feed: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED,
  in_article: process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE,
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  sidebar_2: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_2,
  footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
};

const DEFAULTS: SiteSettings = {
  site_name: SITE_NAME,
  site_tagline: SITE_TAGLINE,
  contact_email: '',
  adsense_client: ADSENSE_CLIENT,
  adsense_slot_header: ENV_SLOTS.header ?? '',
  adsense_slot_in_feed: ENV_SLOTS.in_feed ?? '',
  adsense_slot_in_article: ENV_SLOTS.in_article ?? '',
  adsense_slot_sidebar: ENV_SLOTS.sidebar ?? '',
  adsense_slot_sidebar_2: ENV_SLOTS.sidebar_2 ?? '',
  adsense_slot_footer: ENV_SLOTS.footer ?? '',
  adsense_auto_ads: 'false',
  ga_measurement_id: GA_ID,
  gsc_verification: GSC_VERIFICATION,
  twitter_handle: TWITTER_HANDLE,
  facebook_url: '',
  youtube_url: '',
};

/** Settings as saved in the admin panel, merged over the environment defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_INTERNAL}/api/settings/public`, {
      next: { revalidate: 300, tags: ['settings'] },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return DEFAULTS;
    const stored = (await res.json()) as Partial<SiteSettings>;
    const merged = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS) as (keyof SiteSettings)[]) {
      const value = stored[key];
      if (typeof value === 'string' && value.trim()) merged[key] = value.trim();
    }
    return merged;
  } catch {
    return DEFAULTS;
  }
}

/** AdSense publisher ID plus the slot ID for one placement, or nulls when ads are off. */
export async function getAdUnit(name: AdSlotName): Promise<{ client: string; slot: string } | null> {
  const s = await getSiteSettings();
  const slot = s[`adsense_slot_${name}` as keyof SiteSettings];
  if (!s.adsense_client || !slot) return null;
  return { client: s.adsense_client, slot };
}
