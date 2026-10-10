import StarRounded from '@mui/icons-material/StarRounded';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function RatingBadge({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <Stack
      role="img"
      direction="row"
      spacing={0.5}
      sx={{ alignItems: 'center' }}
      aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} reviews`}
    >
      <StarRounded aria-hidden sx={{ fontSize: 18, color: 'secondary.main' }} />
      <Typography component="span" variant="body2" sx={{ fontWeight: 700 }} aria-hidden>
        {rating.toFixed(1)}
      </Typography>
      <Typography component="span" variant="body2" color="text.secondary" aria-hidden>
        ({reviewCount})
      </Typography>
    </Stack>
  );
}
