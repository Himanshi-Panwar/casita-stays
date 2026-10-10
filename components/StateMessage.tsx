import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface StateMessageProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** `alert` announces immediately (errors); `status` is polite (empty states). */
  role?: 'alert' | 'status';
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  headingLevel?: 'h1' | 'h2' | 'h3';
}

/** Shared presentation for empty / error / not-found states so they feel like one system. */
export function StateMessage({
  title,
  description,
  icon,
  role = 'status',
  actionLabel,
  onAction,
  actionHref,
  headingLevel = 'h2',
}: StateMessageProps) {
  return (
    <Box
      role={role}
      sx={{
        textAlign: 'center',
        py: { xs: 6, md: 9 },
        px: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {icon ? (
        <Box aria-hidden sx={{ color: 'primary.main', display: 'flex', '& svg': { fontSize: 44 } }}>
          {icon}
        </Box>
      ) : null}
      <Typography component={headingLevel} variant="h4">
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
          {description}
        </Typography>
      ) : null}
      {actionLabel && (onAction || actionHref) ? (
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 1.5 }}
          {...(actionHref ? { href: actionHref } : { onClick: onAction })}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}
