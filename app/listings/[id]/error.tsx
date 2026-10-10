'use client';

import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import Container from '@mui/material/Container';
import { useEffect } from 'react';
import { StateMessage } from '@/components/StateMessage';

export default function ListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="md">
      <StateMessage
        role="alert"
        icon={<ErrorOutlineOutlined />}
        title="We couldn’t load this stay"
        description="Something went wrong while loading the listing. Give it another try."
        actionLabel="Try again"
        onAction={reset}
        headingLevel="h1"
      />
    </Container>
  );
}
