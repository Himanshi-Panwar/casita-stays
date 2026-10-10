import CheckRounded from '@mui/icons-material/CheckRounded';
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import type { Listing } from '@/domain/types';

/** Static, content-heavy sections: rendered on the server and shipped as HTML only. */
export function ListingOverview({ listing }: { listing: Listing }) {
  const { host } = listing;
  return (
    <Stack spacing={4} divider={<Divider flexItem />}>
      <section aria-labelledby="about-heading">
        <Typography id="about-heading" component="h2" variant="h3" sx={{ mb: 1.5 }}>
          About this place
        </Typography>
        {listing.description.split('\n\n').map((paragraph) => (
          <Typography key={paragraph} sx={{ mb: 1.5, maxWidth: 70 + 'ch' }}>
            {paragraph}
          </Typography>
        ))}
      </section>

      <section aria-labelledby="amenities-heading">
        <Typography id="amenities-heading" component="h2" variant="h3" sx={{ mb: 2 }}>
          What this place offers
        </Typography>
        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          }}
        >
          {listing.amenities.map((amenity) => (
            <Stack
              component="li"
              key={amenity}
              direction="row"
              spacing={1.25}
              sx={{ alignItems: 'center' }}
            >
              <CheckRounded aria-hidden color="primary" fontSize="small" />
              <Typography variant="body2">{amenity}</Typography>
            </Stack>
          ))}
        </Box>
      </section>

      <section aria-labelledby="host-heading">
        <Typography id="host-heading" component="h2" variant="h3" sx={{ mb: 2 }}>
          Your host
        </Typography>
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              position: 'relative',
              width: 72,
              height: 72,
              flexShrink: 0,
              borderRadius: '50%',
              overflow: 'hidden',
              bgcolor: 'action.hover',
            }}
          >
            <Image
              src={host.avatarUrl}
              alt={`Portrait of ${host.name}`}
              fill
              sizes="72px"
              style={{ objectFit: 'cover' }}
            />
          </Box>
          <Box>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Typography variant="h5" component="h3">
                {host.name}
              </Typography>
              {host.superhost ? (
                <Chip
                  size="small"
                  color="secondary"
                  variant="outlined"
                  icon={<VerifiedOutlined />}
                  label="Superhost"
                />
              ) : null}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Hosting since {host.memberSince} · {host.responseRate}% response rate
            </Typography>
            <Typography variant="body2" sx={{ mt: 1.25, maxWidth: '60ch' }}>
              {host.bio}
            </Typography>
          </Box>
        </Stack>
      </section>
    </Stack>
  );
}
