import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import { WishlistView } from '@/features/wishlist/WishlistView';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };

export default function WishlistPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Typography component="h1" variant="h2" sx={{ mb: 4 }}>
        Your wishlist
      </Typography>
      <WishlistView />
    </Container>
  );
}
