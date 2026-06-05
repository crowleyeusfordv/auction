import { Image } from '@mantine/core';

interface MediaDisplayProps {
  src: string;
  type: 'video' | 'image';
}

export default function MediaDisplay({ src, type = 'image' }: MediaDisplayProps) {
  if (type === 'video') {
    return (
      <video
        className="w-full h-full object-cover"
        src={src}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return (
    <Image src={src} alt="Media" fit='contain' h='100%' />
  );
}
