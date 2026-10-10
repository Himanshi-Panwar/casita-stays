'use client';

import ZoomOutMap from '@mui/icons-material/ZoomOutMap';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Only fetched when a visitor actually opens the lightbox.
const GalleryLightbox = dynamic(() => import('./GalleryLightbox'));

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Photo gallery">
      <Box
        sx={{ position: 'relative', borderRadius: 4, overflow: 'hidden', bgcolor: 'action.hover' }}
      >
        <ButtonBase
          onClick={() => setOpen(true)}
          aria-label={`Open photo ${active + 1} of ${images.length} full screen`}
          sx={{
            display: 'block',
            width: '100%',
            position: 'relative',
            aspectRatio: { xs: '4 / 3', md: '16 / 8' },
          }}
        >
          <Image
            src={images[active] ?? ''}
            alt={`${title}, photo ${active + 1} of ${images.length}`}
            fill
            priority={active === 0}
            sizes="(min-width: 1200px) 1152px, 100vw"
            style={{ objectFit: 'cover' }}
          />
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              bgcolor: 'rgba(255,255,255,.92)',
              borderRadius: 999,
              px: 1.5,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <ZoomOutMap sx={{ fontSize: 16 }} /> {active + 1} / {images.length}
          </Box>
        </ButtonBase>
      </Box>

      <Box
        component="ul"
        aria-label="Choose a photo"
        sx={{
          listStyle: 'none',
          m: 0,
          mt: 1.5,
          p: 0.5,
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
        }}
      >
        {images.map((src, index) => (
          <li key={src}>
            <ButtonBase
              onClick={() => setActive(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === active}
              sx={{
                position: 'relative',
                width: { xs: 72, sm: 104 },
                aspectRatio: '4 / 3',
                borderRadius: 2,
                overflow: 'hidden',
                outline: index === active ? '3px solid' : '1px solid',
                outlineColor: index === active ? 'primary.main' : 'divider',
                outlineOffset: index === active ? 1 : 0,
                opacity: index === active ? 1 : 0.8,
              }}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="104px"
                loading="lazy"
                style={{ objectFit: 'cover' }}
              />
            </ButtonBase>
          </li>
        ))}
      </Box>

      {open ? (
        <GalleryLightbox
          images={images}
          title={title}
          index={active}
          onIndexChange={setActive}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </section>
  );
}
