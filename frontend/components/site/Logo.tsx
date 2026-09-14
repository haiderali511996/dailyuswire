import Image from 'next/image';
import Link from 'next/link';

import { SITE_NAME } from '@/lib/config';

export function Logo({
  variant = 'default',
  className = '',
  priority = false,
  width = 260,
}: {
  variant?: 'default' | 'white';
  className?: string;
  priority?: boolean;
  width?: number;
}) {
  return (
    <Link href="/" aria-label={`${SITE_NAME} home`} className={className}>
      <Image
        src={variant === 'white' ? '/logo-white.png' : '/logo.png'}
        alt={SITE_NAME}
        width={width}
        height={Math.round((width * 210) / 900)}
        priority={priority}
        className="h-auto w-full"
      />
    </Link>
  );
}
