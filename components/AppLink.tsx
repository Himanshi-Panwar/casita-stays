'use client';

import Link, { type LinkProps } from '@mui/material/Link';
import NextLink from 'next/link';

/**
 * MUI link that navigates through next/link. A client component so Server Components can use
 * it without passing a component *function* across the server/client boundary.
 */
export function AppLink(props: Omit<LinkProps<typeof NextLink>, 'component'>) {
  return <Link component={NextLink} {...props} />;
}
