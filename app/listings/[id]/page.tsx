import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { BookingExperience } from '@/features/booking/BookingExperience';
import { Gallery } from '@/features/listing/Gallery';
import { ListingHeader } from '@/features/listing/ListingHeader';
import { ListingOverview } from '@/features/listing/ListingOverview';
import { AppError } from '@/lib/server/errors';
import { listingsService } from '@/lib/server/listings-service';
import { today } from '@/lib/server/clock';

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Deduplicated per request: `generateMetadata` and the page share one lookup. */
const loadListing = cache((id: string) => {
  try {
    return listingsService.getById(id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const listing = loadListing((await params).id);
  if (!listing) return { title: 'Stay not found' };
  const description = `${listing.title} in ${listing.city}, ${listing.country} — from $${listing.pricePerNight}/night. Up to ${listing.maxGuests} guests.`;
  return {
    title: listing.title,
    description,
    alternates: { canonical: `/listings/${listing.id}` },
    openGraph: { title: listing.title, description, images: listing.images.slice(0, 1) },
  };
}

export default async function ListingPage({ params }: PageProps) {
  const listing = loadListing((await params).id);
  if (!listing) notFound();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <ListingHeader listing={listing} />
      <Box sx={{ mt: 3 }}>
        <Gallery images={listing.images} title={listing.title} />
      </Box>
      {/* Client island: owns date selection + booking. The server-rendered overview is passed
          in as children, so it stays a Server Component and adds no client JS. */}
      <BookingExperience
        listing={{
          id: listing.id,
          title: listing.title,
          pricePerNight: listing.pricePerNight,
          maxGuests: listing.maxGuests,
        }}
        today={today()}
      >
        <ListingOverview listing={listing} />
      </BookingExperience>
    </Container>
  );
}
