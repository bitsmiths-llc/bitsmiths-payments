'use client';

import { useEffect } from 'react';

/**
 * Redirects real browsers to the Stripe-session endpoint on mount. Link-preview
 * crawlers don't execute this, so they stay on the page and read its OG tags.
 */
export function CheckoutRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return null;
}
