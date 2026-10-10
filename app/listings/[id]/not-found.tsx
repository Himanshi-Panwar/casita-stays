import ExploreOffOutlined from '@mui/icons-material/ExploreOffOutlined';
import Container from '@mui/material/Container';
import { StateMessage } from '@/components/StateMessage';

export default function ListingNotFound() {
  return (
    <Container maxWidth="md">
      <StateMessage
        icon={<ExploreOffOutlined />}
        title="That stay doesn’t exist"
        description="It may have been removed, or the link is mistyped. Browse our current stays instead."
        actionLabel="Browse stays"
        actionHref="/"
        headingLevel="h1"
      />
    </Container>
  );
}
