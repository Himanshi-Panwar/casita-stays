import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { formatMoney, pluralize } from '@/lib/format';
import type { PriceBreakdown as Breakdown } from '@/domain/types';
import { CLEANING_FEE, SERVICE_FEE_RATE } from '@/domain/pricing';

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography component="dt" variant="body2" sx={{ fontWeight: strong ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: strong ? 700 : 400 }}>
        {value}
      </Typography>
    </Box>
  );
}

/** Presentational and server-safe: used live in the booking card and on the confirmation page. */
export function PriceBreakdown({ price }: { price: Breakdown }) {
  return (
    <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1.25 }}>
      <Row
        label={`${formatMoney(price.pricePerNight)} × ${pluralize(price.nights, 'night')}`}
        value={formatMoney(price.subtotal)}
      />
      <Row label="Cleaning fee" value={formatMoney(price.cleaningFee || CLEANING_FEE)} />
      <Row
        label={`Service fee (${Math.round(SERVICE_FEE_RATE * 100)}%)`}
        value={formatMoney(price.serviceFee)}
      />
      <Divider />
      <Row label="Total" value={formatMoney(price.total)} strong />
    </Box>
  );
}
