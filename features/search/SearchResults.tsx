'use client';

import SearchOffOutlined from '@mui/icons-material/SearchOffOutlined';
import WifiOffOutlined from '@mui/icons-material/WifiOffOutlined';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useState } from 'react';
import { StateMessage } from '@/components/StateMessage';
import type { ListingsQuery } from '@/domain/search';
import { ApiError } from '@/lib/api/errors';
import { ListingCard, listingGridSx } from './ListingCard';
import { searchHref } from './search-url';
import { type ServerSeed, useListingsQuery } from './use-listings-query';

function ResultsSkeleton() {
  return (
    <Box component="ul" sx={listingGridSx} aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}>
          <Skeleton variant="rounded" sx={{ aspectRatio: '4 / 3', height: 'auto' }} />
          <Skeleton width="40%" sx={{ mt: 1.5 }} />
          <Skeleton width="80%" height={32} />
          <Skeleton width="55%" />
        </li>
      ))}
    </Box>
  );
}

interface SearchResultsProps {
  /** The query parsed from the URL (source of truth). */
  query: ListingsQuery;
  /** First server render, used to hydrate without an extra request. */
  initial: ServerSeed;
}

export function SearchResults({ query, initial }: SearchResultsProps) {
  // Freeze the first server render; later server renders must not override client fetches.
  const [seed] = useState(initial);
  const { data, error, isPending, isFetching, isPlaceholderData, failureCount, refetch } =
    useListingsQuery(query, seed);

  if (isPending) {
    return (
      <section aria-labelledby="results-heading" aria-busy="true">
        <Typography id="results-heading" component="h2" variant="h4" sx={{ mb: 2 }}>
          Finding stays…
        </Typography>
        {failureCount > 0 ? (
          <Typography role="status" color="text.secondary" sx={{ mb: 2 }}>
            Having trouble reaching the server — retrying…
          </Typography>
        ) : null}
        <ResultsSkeleton />
      </section>
    );
  }

  if (error || !data) {
    const message =
      error instanceof ApiError ? error.message : 'We could not load stays right now.';
    return (
      <StateMessage
        role="alert"
        icon={<WifiOffOutlined />}
        title="We couldn’t load stays"
        description={`${message} Your filters are saved in the URL, so nothing is lost.`}
        actionLabel="Try again"
        onAction={() => void refetch()}
      />
    );
  }

  const { items, total, page, pageSize, totalPages } = data;

  if (total === 0) {
    return (
      <StateMessage
        icon={<SearchOffOutlined />}
        title="No stays match your filters"
        description="Try a different city, widen your price range, or reduce the number of guests."
        actionLabel="Clear all filters"
        actionHref="/"
      />
    );
  }

  const first = (page - 1) * pageSize + 1;
  const last = first + items.length - 1;

  return (
    <section aria-labelledby="results-heading" aria-busy={isFetching}>
      <Box sx={{ height: 4, mb: 1.5 }}>
        {isFetching ? (
          <LinearProgress aria-label="Updating results" sx={{ borderRadius: 2 }} />
        ) : null}
      </Box>
      <Typography id="results-heading" component="h2" variant="h4" sx={{ mb: 2.5 }}>
        {total} {total === 1 ? 'stay' : 'stays'}
        <Typography
          component="span"
          color="text.secondary"
          role="status"
          sx={{ ml: 1.5, fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}
        >
          Showing {first}–{last}
        </Typography>
      </Typography>

      <Box
        component="ul"
        sx={{ ...listingGridSx, opacity: isPlaceholderData ? 0.55 : 1, transition: 'opacity .15s' }}
      >
        {items.map((listing, index) => (
          <li key={listing.id}>
            <ListingCard listing={listing} priority={index < 3 && page === 1} />
          </li>
        ))}
      </Box>

      {totalPages > 1 ? (
        <Box
          component="nav"
          aria-label="Pagination"
          sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}
        >
          <Pagination
            count={totalPages}
            page={page}
            size="large"
            siblingCount={0}
            boundaryCount={1}
            renderItem={(item) => (
              <PaginationItem
                {...item}
                component={NextLink}
                href={searchHref({ ...query, page: item.page ?? 1 })}
                prefetch={false}
                scroll
              />
            )}
          />
        </Box>
      ) : null}
    </section>
  );
}
