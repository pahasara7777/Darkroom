import { useState } from 'react';

// Mount with key={image?.id} so each new print develops from scratch.
export default function Tray({ busy, secs, image, caption, children }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <figure className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-ink bg-tray text-print shadow-[8px_8px_0_0_var(--color-ink)]">
      {image ? (
        <img
          src={image.url}
          alt={image.prompt}
          onLoad={() => setLoaded(true)}
          className={'absolute inset-0 h-full w-full object-cover ' + (loaded ? 'develop' : 'opacity-0')}
        />
      ) : busy ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div role="status">
            <div className="relative mx-auto mb-4 size-20">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-print/25 border-t-safelight motion-reduce:animate-none" />
              <div className="safelight-pulse absolute inset-5 rounded-full bg-safelight" />
            </div>
            <p className="display text-2xl">Developing</p>
            <p className="mt-1 tabular-nums">{secs}s</p>
          </div>
        </div>
      ) : children ? (
        <div className="absolute inset-0">{children}</div>
      ) : (
        <div className="absolute inset-0 grid place-items-center p-6 text-center"><p className="max-w-xs text-lg">{caption || 'Your print appears here.'}</p></div>
      )}
    </figure>
  );
}
