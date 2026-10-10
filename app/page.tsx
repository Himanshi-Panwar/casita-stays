import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { type RawQuery, parseListingsQueryLenient } from '@/domain/search';
import { SearchFilters } from '@/features/search/SearchFilters';
import { SearchResults } from '@/features/search/SearchResults';
import { listingsService } from '@/lib/server/listings-service';
import { CITY_NAMES } from '@/mocks/listings';

export const metadata: Metadata = {
  title: 'Find your next stay',
  alternates: { canonical: '/' },
};

interface PageProps {
  searchParams: Promise<RawQuery>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  // Lenient: a hand-edited or stale URL degrades to defaults instead of erroring.
  const query = parseListingsQueryLenient(await searchParams);
  // Server-render the first results straight from the service (no HTTP hop to ourselves).
  const data = listingsService.search(query);

  return (
    <>
      <Box
        sx={{
          pt: { xs: 5, md: 9 },
          pb: { xs: 3, md: 4 },
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="overline" color="secondary" component="p">
            Boutique homes · 8 cities
          </Typography>
          <Typography component="h1" variant="h1" sx={{ maxWidth: 780, mt: 1 }}>
            Stay somewhere that feels like a <em>home</em>, not a hotel.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 560, fontSize: '1.125rem' }}>
            Hand-picked casitas, lofts and villas with local hosts. Filter by city, price and party
            size.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 } }}>
        <SearchFilters query={query} cityOptions={CITY_NAMES}/>
        <Box sx={{ mt: { xs: 4, md: 5 } }}>
          <SearchResults query={query} initial={{ query, data }} />
        </Box>
      </Container>
    </>
  );
}
