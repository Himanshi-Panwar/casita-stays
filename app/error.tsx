'use client';

import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';
import Container from '@mui/material/Container';
import { useEffect } from 'react';
import { StateMessage } from '@/components/StateMessage';

export default function GlobalError({
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
        title="Something went wrong"
        description="An unexpected error occurred. You can try again, or head back to search."
        actionLabel="Try again"
        onAction={reset}
        headingLevel="h1"
      />
    </Container>
  );
}
