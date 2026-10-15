import React from 'react';

// The FutureTech logo, exported from public/logo.png with its white matte removed
// so it sits cleanly on dark surfaces. Artwork, wordmark and proportions are unchanged.
const SOURCES = {
  sm: { src: '/brand/futuretech-logo-sm.webp', width: 142, height: 112 },
  lg: { src: '/brand/futuretech-logo.webp', width: 367, height: 289 }
};

export const BrandLogo = ({ size = 'sm', className, alt = 'FutureTech', priority = false, style }) => {
  const { src, width, height } = SOURCES[size] || SOURCES.sm;
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={alt}
      className={className}
      style={style}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      draggable="false"
    />
  );
};
