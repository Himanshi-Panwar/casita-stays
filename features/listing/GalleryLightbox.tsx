'use client';

import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Close from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

interface GalleryLightboxProps {
  images: string[];
  title: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Loaded on demand (next/dynamic) so its code is not part of the initial listing bundle. */
export default function GalleryLightbox({
  images,
  title,
  index,
  onIndexChange,
  onClose,
}: GalleryLightboxProps) {
  const count = images.length;
  const go = (delta: number) => onIndexChange((index + delta + count) % count);

  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      aria-label={`${title} photo gallery`}
      slotProps={{ paper: { sx: { bgcolor: '#101614', color: '#fff' } } }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') go(1);
        if (event.key === 'ArrowLeft') go(-1);
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5 }}>
        <Typography aria-live="polite" sx={{ pl: 1 }}>
          Photo {index + 1} of {count}
        </Typography>
        <IconButton onClick={onClose} aria-label="Close gallery" sx={{ color: '#fff' }} autoFocus>
          <Close />
        </IconButton>
      </Box>
      <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0 }}>
        <Image
          src={images[index] ?? ''}
          alt={`${title}, photo ${index + 1} of ${count}`}
          fill
          sizes="100vw"
          style={{ objectFit: 'contain' }}
        />
        {count > 1 ? (
          <>
            <IconButton
              onClick={() => go(-1)}
              aria-label="Previous photo"
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                color: '#fff',
                bgcolor: 'rgba(0,0,0,.45)',
                '&:hover': { bgcolor: 'rgba(0,0,0,.7)' },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              onClick={() => go(1)}
              aria-label="Next photo"
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                color: '#fff',
                bgcolor: 'rgba(0,0,0,.45)',
                '&:hover': { bgcolor: 'rgba(0,0,0,.7)' },
              }}
            >
              <ChevronRight />
            </IconButton>
          </>
        ) : null}
      </Box>
    </Dialog>
  );
}
