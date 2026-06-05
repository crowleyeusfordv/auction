import { Image, Loader, Flex } from '@mantine/core';
import { useState } from 'react';

interface MediaDisplayProps {
  src: string;
  type: 'video' | 'image';
}

export default function MediaDisplay({ src, type = 'image' }: MediaDisplayProps) {
  const [isLoading, setIsLoading] = useState(!!src);

  return (
    <>
      {isLoading && (
        <Flex pos="absolute" inset={0} align="center" justify="center" style={{ zIndex: 1 }}>
          <Loader color="white" />
        </Flex>
      )}
      {type === 'video' ? (
        <video
          className="w-full h-full object-cover"
          src={src}
          autoPlay
          loop
          muted
          playsInline
          onCanPlay={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      ) : (
        <Image 
          src={src} 
          alt="Media" 
          fit='contain' 
          h='100%' 
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      )}
    </>
  );
}
