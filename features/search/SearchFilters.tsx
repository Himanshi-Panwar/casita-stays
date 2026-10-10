'use client';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useRouter } from 'next/navigation';
import { useEffect, useEffectEvent, useState, useTransition } from 'react';

import {
  type ListingsQuery,
  MAX_GUESTS_FILTER,
  SORT_LABELS,
  SORT_OPTIONS,
} from '@/domain/search';
import type { SortOption } from '@/domain/types';

import { searchHref } from './search-url';
import { useDebouncedValue } from './use-debounced-value';

const DEBOUNCE_MS = 400;

interface Draft {
  city: string;
  minPrice: string;
  maxPrice: string;
}

interface SearchFiltersProps {
  query: ListingsQuery;
  cityOptions: readonly string[];
}

const draftFrom = (query: ListingsQuery): Draft => ({
  city: query.city ?? '',
  minPrice:
    query.minPrice === undefined ? '' : String(query.minPrice),
  maxPrice:
    query.maxPrice === undefined ? '' : String(query.maxPrice),
});

const sameDraft = (a: Draft, b: Draft) =>
  a.city === b.city &&
  a.minPrice === b.minPrice &&
  a.maxPrice === b.maxPrice;

function toNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : undefined;
}

export function SearchFilters({
  query,
  cityOptions,
}: SearchFiltersProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [draft, setDraft] = useState<Draft>(() => draftFrom(query));

  const debounced = useDebouncedValue(draft, DEBOUNCE_MS);

  const isTyping = !sameDraft(draft, debounced);

  const minPrice = toNumber(draft.minPrice);
  const maxPrice = toNumber(draft.maxPrice);

  const priceError =
    minPrice !== undefined &&
    maxPrice !== undefined &&
    minPrice > maxPrice
      ? 'Minimum must not exceed maximum'
      : undefined;

  const navigate = (next: ListingsQuery) => {
    startTransition(() => {
      router.replace(searchHref(next), { scroll: false });
    });
  };

  const pushDraft = useEffectEvent((next: Draft) => {
    if (sameDraft(next, draftFrom(query))) return;

    const min = toNumber(next.minPrice);
    const max = toNumber(next.maxPrice);

    // Do not apply invalid price ranges.
    if (min !== undefined && max !== undefined && min > max) {
      return;
    }

    navigate({
      ...query,
      city: next.city.trim() || undefined,
      minPrice: min,
      maxPrice: max,
      page: 1,
    });
  });

  useEffect(() => {
    pushDraft(debounced);
  }, [debounced]);

  // Keep the input synchronized with URL changes.
  const urlDraft = draftFrom(query);
  const [syncedDraft, setSyncedDraft] = useState(urlDraft);

  if (
    !sameDraft(urlDraft, syncedDraft) &&
    !isPending &&
    !isTyping
  ) {
    setSyncedDraft(urlDraft);
    setDraft(urlDraft);
  }

  const setField =
    (field: keyof Draft) => (value: string) => {
      setDraft((previous) => ({
        ...previous,
        [field]: value,
      }));
    };

  const matchingCityCount = cityOptions.filter((city) =>
    city
      .toLowerCase()
      .includes(draft.city.trim().toLowerCase()),
  ).length;

  const hasFilters =
    Boolean(query.city) ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    query.guests !== undefined ||
    query.sort !== 'relevance';

  return (
    <Box
      component="form"
      role="search"
      aria-label="Filter stays"
      onSubmit={(event) => event.preventDefault()}
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr 1fr',
          md: '2fr 1fr 1fr 1fr 1.3fr',
        },
        alignItems: 'start',
        p: { xs: 2, md: 2.5 },
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 4,
        boxShadow: '0 10px 30px rgba(28,38,34,.08)',
      }}
    >
      {/* City autocomplete */}
      <Autocomplete
        freeSolo
        openOnFocus
        options={[...cityOptions]}
        value={draft.city}
        inputValue={draft.city}
        filterOptions={(options, state) =>
          options.filter((city) =>
            city
              .toLowerCase()
              .includes(state.inputValue.trim().toLowerCase()),
          )
        }
        onChange={(_, value) => {
          setField('city')(value ?? '');
        }}
        onInputChange={(_, value, reason) => {
          if (reason === 'input' || reason === 'clear') {
            setField('city')(value);
          }
        }}
        noOptionsText="No matching cities"
        renderInput={(params) => (
          <TextField
            {...params}
            label="Where to?"
            placeholder="Search city, e.g. London, Toronto..."
            helperText={`${matchingCityCount} matching ${
              matchingCityCount === 1 ? 'city' : 'cities'
            }`}
          />
        )}
      />

      {/* Minimum price */}
      <TextField
        label="Min price"
        type="number"
        value={draft.minPrice}
        onChange={(event) =>
          setField('minPrice')(event.target.value)
        }
        error={Boolean(priceError)}
        slotProps={{
          htmlInput: {
            min: 0,
            step: 10,
            inputMode: 'numeric',
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                $
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Maximum price */}
      <TextField
        label="Max price"
        type="number"
        value={draft.maxPrice}
        onChange={(event) =>
          setField('maxPrice')(event.target.value)
        }
        error={Boolean(priceError)}
        helperText={priceError}
        slotProps={{
          htmlInput: {
            min: 0,
            step: 10,
            inputMode: 'numeric',
          },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                $
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Guest filter */}
      <TextField
        select
        label="Guests"
        value={
          query.guests === undefined
            ? ''
            : String(query.guests)
        }
        onChange={(event) =>
          navigate({
            ...query,
            guests:
              event.target.value === ''
                ? undefined
                : Number(event.target.value),
            page: 1,
          })
        }
        slotProps={{
          select: { native: true },
          inputLabel: { shrink: true },
        }}
      >
        <option value="">Any</option>

        {Array.from(
          { length: MAX_GUESTS_FILTER },
          (_, index) => index + 1,
        ).map((number) => (
          <option key={number} value={number}>
            {number}+ {number === 1 ? 'guest' : 'guests'}
          </option>
        ))}
      </TextField>

      {/* Sorting */}
      <TextField
        select
        label="Sort by"
        value={query.sort}
        onChange={(event) =>
          navigate({
            ...query,
            sort: event.target.value as SortOption,
            page: 1,
          })
        }
        slotProps={{
          select: { native: true },
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </TextField>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          href="/"
          variant="text"
          color="primary"
          sx={{
            gridColumn: '1 / -1',
            justifySelf: 'start',
            minHeight: 44,
          }}
        >
          Clear all filters
        </Button>
      )}
    </Box>
  );
}

