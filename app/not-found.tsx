import ExploreOffOutlined from '@mui/icons-material/ExploreOffOutlined';
import Container from '@mui/material/Container';
import { StateMessage } from '@/components/StateMessage';

export default function NotFound() {
  return (
    <Container maxWidth="md">
      <StateMessage
        icon={<ExploreOffOutlined />}
        title="We couldn’t find that page"
        description="The link may be out of date. Let’s get you back to browsing stays."
        actionLabel="Browse stays"
        actionHref="/"
        headingLevel="h1"
      />
    </Container>
  );
}
