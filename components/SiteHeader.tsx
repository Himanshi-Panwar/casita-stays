import HomeWorkOutlined from '@mui/icons-material/HomeWorkOutlined';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { AppLink } from './AppLink';

export function SiteHeader() {
  return (
    <Box
      component="header"
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Container maxWidth="lg" sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AppLink
          href="/"
          underline="none"
          color="primary"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minHeight: 44 }}
        >
          <HomeWorkOutlined aria-hidden />
          <Typography component="span" variant="h5" sx={{ fontWeight: 700 }}>
            Casita Stays
          </Typography>
        </AppLink>
        <Box
          component="nav"
          aria-label="Main"
          sx={{ ml: 'auto', display: 'flex', gap: { xs: 1, sm: 3 } }}
        >
          {[
            ['/bookings', 'My bookings'],
            ['/wishlist', 'Wishlist'],
          ].map(([href, label]) => (
            <AppLink
              key={href}
              href={href as string}
              color="text.primary"
              underline="hover"
              sx={{ fontWeight: 600, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
            >
              {label}
            </AppLink>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
