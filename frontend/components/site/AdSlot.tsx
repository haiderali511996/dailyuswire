import { type AdSlotName, getAdUnit } from '@/lib/site-settings';

import { type AdFormat, AdSlotClient } from './AdSlotClient';

/**
 * Google AdSense placement, configured from the admin panel (Settings ->
 * Google AdSense) with the NEXT_PUBLIC_ADSENSE_* variables as fallback.
 * Renders nothing at all until both the publisher ID and this slot's ID are
 * set, so the site stays clean while the AdSense application is pending.
 */
export async function AdSlot({
  name,
  format = 'rectangle',
  label,
  className,
}: {
  name: AdSlotName;
  format?: AdFormat;
  label?: string;
  className?: string;
}) {
  const unit = await getAdUnit(name);
  if (!unit) return null;
  return <AdSlotClient client={unit.client} slot={unit.slot} format={format} label={label} className={className} />;
}
