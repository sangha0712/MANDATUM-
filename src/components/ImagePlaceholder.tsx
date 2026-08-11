import React, { useEffect, useState } from 'react';
import { cn } from '../utils';
import { Image as ImageIcon } from 'lucide-react';

interface ImagePlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  text?: string;
  imageStyle?: React.CSSProperties;
  loading?: 'eager' | 'lazy';
  revealWhenDecoded?: boolean;
  width?: number;
  height?: number;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function ImagePlaceholder({ src, alt, text = 'IMAGE NOT ASSIGNED', className, imageStyle, loading = 'eager', revealWhenDecoded = false, width, height, fetchPriority = 'auto', ...props }: ImagePlaceholderProps) {
  const [error, setError] = useState(false);
  const [decoded, setDecoded] = useState(!revealWhenDecoded);

  useEffect(() => {
    setError(false);
    setDecoded(!revealWhenDecoded);
  }, [src, revealWhenDecoded]);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        width={width}
        height={height}
        fetchPriority={fetchPriority}
        draggable={false}
        className={cn(
          'object-cover',
          className,
          revealWhenDecoded && !decoded && 'opacity-0',
        )}
        style={imageStyle}
        onLoad={(event) => {
          if (!revealWhenDecoded) return;
          const image = event.currentTarget;
          const loadedSource = image.currentSrc;
          const reveal = () => {
            if (image.currentSrc === loadedSource) setDecoded(true);
          };
          void image.decode().then(reveal, reveal);
        }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-[#18232F] border border-[#293644] text-[#8996A3]',
        className
      )}
      {...props}
    >
      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
      <span className="text-xs font-mono tracking-wider opacity-70">{text}</span>
    </div>
  );
}
