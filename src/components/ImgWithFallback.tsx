import { useState } from 'react';
import { Home } from 'lucide-react';

interface ImgWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackClassName?: string;
}

/**
 * Drop-in replacement for <img> that shows an elegant placeholder when the
 * image fails to load or when no src is provided.
 */
export function ImgWithFallback({
  src,
  alt = '',
  className = '',
  fallbackClassName,
  ...rest
}: ImgWithFallbackProps) {
  const [failed, setFailed] = useState(!src || !src.startsWith('https://'));

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${fallbackClassName ?? className}`}
        aria-label={alt}
      >
        <Home className="w-8 h-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
