import { useState } from 'react';
import { useUploadFile } from './useUpload';
import { extractVideoFrame } from '@/shared/utils/video';

export function useMediaUpload() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { mutateAsync: uploadFile, isPending } = useUploadFile();

  const handleImageChange = (file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      setUploadError('Image exceeds 5MB limit');
      setImageFile(null);
    } else {
      setUploadError(null);
      setImageFile(file);
    }
  };

  const handleVideoChange = (file: File | null) => {
    if (file && file.size > 50 * 1024 * 1024) {
      setUploadError('Video exceeds 50MB limit');
      setVideoFile(null);
    } else {
      setUploadError(null);
      setVideoFile(file);
    }
  };

  const uploadMedia = async (): Promise<{ imageUrl: string | null; videoUrl: string | null }> => {
    setUploadError(null);
    
    let finalImageFile = imageFile;

    if (videoFile && !imageFile) {
      try {
        finalImageFile = await extractVideoFrame(videoFile, 1);
      } catch (err) {
        console.error('Failed to extract video frame', err);
      }
    }

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;

    const uploadPromises: Promise<void>[] = [];
    
    if (finalImageFile) {
      uploadPromises.push(
        uploadFile(finalImageFile).then(res => {
          imageUrl = res.url;
        })
      );
    }
    
    if (videoFile) {
      uploadPromises.push(
        uploadFile(videoFile).then(res => {
          videoUrl = res.url;
        })
      );
    }

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }

    return { imageUrl, videoUrl };
  };

  const resetMedia = () => {
    setImageFile(null);
    setVideoFile(null);
    setUploadError(null);
  };

  return {
    imageFile,
    videoFile,
    uploadError,
    isUploading: isPending,
    setUploadError,
    handleImageChange,
    handleVideoChange,
    uploadMedia,
    resetMedia
  };
}
