import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { forwardRef } from 'react';

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  placeholder?: 'empty' | 'blur' | 'data:image';
  loader?: (props: { src: string; width: number; quality?: number }) => string;
  style?: CSSProperties;
}

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, alt, width, height, fill, priority, quality, placeholder, loader, style, ...rest },
  ref,
) {
  void priority;
  void quality;
  void placeholder;
  void loader;

  const resolvedStyle: CSSProperties = {
    ...(width !== undefined ? { width } : null),
    ...(height !== undefined ? { height } : null),
    ...(fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : null),
    ...style,
  };

  return <img ref={ref} src={src} alt={alt} style={resolvedStyle} {...rest} />;
});

export default Image;
