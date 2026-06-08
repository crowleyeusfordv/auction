import { ActionIcon, Image, Loader, Flex, Tooltip } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { LuVolume2, LuVolumeX } from 'react-icons/lu';
import { resolveMediaUrl } from '@/shared/config/urls';

interface MediaDisplayProps {
  src: string;
  type: 'video' | 'image';
  isActive?: boolean;
}

export default function MediaDisplay({ src, type = 'image', isActive = true }: MediaDisplayProps) {
  const [isLoading, setIsLoading] = useState(!!src);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaSrc = resolveMediaUrl(src) || '';

  useEffect(() => {
    setIsLoading(!!mediaSrc);
  }, [mediaSrc]);

  useEffect(() => {
    if (type !== 'video' || !videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(() => undefined);
      return;
    }

    videoRef.current.pause();
  }, [isActive, type]);

  const toggleMuted = () => {
    setIsMuted((current) => {
      const nextMuted = !current;

      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
        videoRef.current.play().catch(() => undefined);
      }

      return nextMuted;
    });
  };

  return (
    <>
      {isLoading && (
        <Flex pos="absolute" inset={0} align="center" justify="center" style={{ zIndex: 1 }}>
          <Loader color="white" />
        </Flex>
      )}
      {type === 'video' ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            src={mediaSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onCanPlay={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
          <Tooltip label={isMuted ? '打开声音' : '关闭声音'} position="left">
            <ActionIcon
              aria-label={isMuted ? '打开声音' : '关闭声音'}
              onClick={toggleMuted}
              pos="absolute"
              top={64}
              right={16}
              size="lg"
              radius="xl"
              color="dark"
              variant="filled"
              style={{ zIndex: 3, opacity: 0.82 }}
            >
              {isMuted ? <LuVolumeX size={20} /> : <LuVolume2 size={20} />}
            </ActionIcon>
          </Tooltip>
        </>
      ) : (
        <Image 
          src={mediaSrc}
          alt="媒体内容"
          fit='contain' 
          h='100%' 
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      )}
    </>
  );
}
