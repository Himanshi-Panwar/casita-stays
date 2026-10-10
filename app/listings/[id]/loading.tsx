import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';

export default function Loading() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }} aria-busy="true">
      <span role="status" style={{ position: 'absolute', left: -9999 }}>
        Loading stay…
      </span>
      <Skeleton width={180} />
      <Skeleton variant="text" sx={{ fontSize: '2.5rem' }} width="70%" />
      <Skeleton width="45%" />
      <Skeleton
        variant="rounded"
        sx={{ mt: 3, aspectRatio: { xs: '4 / 3', md: '16 / 8' }, height: 'auto' }}
      />
      <Box
        sx={{ mt: 5, display: 'grid', gap: 5, gridTemplateColumns: { xs: '1fr', md: '1fr 400px' } }}
      >
        <Box>
          <Skeleton variant="text" sx={{ fontSize: '2rem' }} width="40%" />
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={20} width="80%" />
        </Box>
        <Skeleton variant="rounded" height={420} />
      </Box>
    </Container>
  );
}
