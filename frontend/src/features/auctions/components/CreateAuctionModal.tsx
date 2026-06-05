import { Modal, TextInput, NumberInput, Checkbox, Button, Stack, Select, Group, FileInput, Text } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAuction } from '../hooks/useAuctions';
import { useUploadFile } from '../hooks/useUpload';
import { useState } from 'react';
import { extractVideoFrame } from '@/shared/utils/video';

function getNextOccurrenceISO(timeStr: string): string | null {
  if (timeStr === 'now') return null;

  const isPm = timeStr.includes('pm');
  let hour = parseInt(timeStr);

  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;

  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  if (date.getTime() < new Date().getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString();
}

const schema = z.object({
  productName: z.string().min(1, 'Required'),
  description: z.string().optional(),
  startingBid: z.number().min(0),
  incrementValue: z.number().positive('Must be greater than 0'),
  buyOutPrice: z.number().min(0),
  baseDuration: z.number().min(1),
  scheduledTimeToStart: z.string(),
  extendedDuration: z.object({
    trigger: z.number(),
    secondsAdded: z.number()
  }).optional()
});

export function CreateAuctionModal({ opened, onClose, sellerId }: { opened: boolean; onClose: () => void; sellerId: string }) {
  const [hasExtended, setHasExtended] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { mutate: createAuction, isPending: isCreating } = useCreateAuction();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: '', description: '', startingBid: 0, incrementValue: 1,
      buyOutPrice: 0, baseDuration: 60, scheduledTimeToStart: 'now',
      extendedDuration: { trigger: 10, secondsAdded: 30 }
    }
  });

  const handleClose = () => {
    reset();
    setImageFile(null);
    setVideoFile(null);
    setUploadError(null);
    onClose();
  };

  const onSubmit = async (data: any) => {
    setUploadError(null);
    const payload = { ...data, sellerId };
    
    if (!hasExtended) delete payload.extendedDuration;
    payload.scheduledTimeToStart = getNextOccurrenceISO(payload.scheduledTimeToStart);

    try {
      let finalImageFile = imageFile;

      // Se tem vídeo mas não tem imagem, gera o print do vídeo
      if (videoFile && !imageFile) {
        finalImageFile = await extractVideoFrame(videoFile, 1);
      }

      let imageUrl = null;
      let videoUrl = null;

      // Upload das mídias em paralelo
      const uploadPromises = [];
      
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

      if (imageUrl) payload.imageUrl = imageUrl;
      if (videoUrl) payload.videoUrl = videoUrl;

      createAuction(payload, { 
        onSuccess: handleClose,
        onError: (err) => {
          console.error('Create auction failed:', err);
          setUploadError(`API Error: ${err.message}`);
        }
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Failed to process or upload media. Please try again.');
    }
  };

  const isPending = isCreating || isUploading;

  return (
    <Modal opened={opened} onClose={handleClose} title="Create Auction" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput label="Name of the product" {...register('productName')} error={errors.productName?.message} />
          <TextInput label="Description" {...register('description')} error={errors.description?.message} />
          
          <Group grow align="flex-start">
            <FileInput 
              label="Product Image (Optional)" 
              placeholder="Select an image"
              accept="image/*" 
              value={imageFile} 
              onChange={(file) => {
                if (file && file.size > 5 * 1024 * 1024) {
                  setUploadError('Image exceeds 5MB limit');
                  setImageFile(null);
                } else {
                  setUploadError(null);
                  setImageFile(file);
                }
              }} 
              clearable
            />
            <FileInput 
              label="Product Video (Optional)" 
              placeholder="Select a video"
              accept="video/*" 
              value={videoFile} 
              onChange={(file) => {
                if (file && file.size > 50 * 1024 * 1024) {
                  setUploadError('Video exceeds 50MB limit');
                  setVideoFile(null);
                } else {
                  setUploadError(null);
                  setVideoFile(file);
                }
              }}
              clearable
            />
          </Group>
          <Text size="xs" c="dimmed">
            If you only upload a video, a cover image will be automatically generated from it.
          </Text>
          {uploadError && <Text size="sm" c="red">{uploadError}</Text>}

          <Group grow>
            <Controller name="startingBid" control={control} render={({ field }) => <NumberInput label="Starting bid" {...field} error={errors.startingBid?.message} />} />
            <Controller name="incrementValue" control={control} render={({ field }) => <NumberInput label="Fixed increment" {...field} error={errors.incrementValue?.message} />} />
            <Controller name="buyOutPrice" control={control} render={({ field }) => <NumberInput label="Highest bid (buy-out)" {...field} error={errors.buyOutPrice?.message} />} />
          </Group>

          <Controller name="baseDuration" control={control} render={({ field }) => <NumberInput label="Base duration (minutes)" {...field} error={errors.baseDuration?.message} />} />

          <Checkbox label="Extended duration" checked={hasExtended} onChange={(e) => setHasExtended(e.currentTarget.checked)} />
          {hasExtended && (
            <Group grow>
              <Controller name="extendedDuration.trigger" control={control} render={({ field }) => <NumberInput label="Trigger (seconds before finish)" {...field} error={errors.extendedDuration?.trigger?.message} />} />
              <Controller name="extendedDuration.secondsAdded" control={control} render={({ field }) => <NumberInput label="Seconds added" {...field} error={errors.extendedDuration?.secondsAdded?.message} />} />
            </Group>
          )}

          <Controller
            name="scheduledTimeToStart"
            control={control}
            render={({ field }) => (
              <Select
                label="When this gonna start"
                data={['now', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm']}
                {...field}
                error={errors.scheduledTimeToStart?.message}
              />
            )}
          />

          <Button type="submit" loading={isPending} fullWidth mt="md">Create Auction</Button>
        </Stack>
      </form>
    </Modal>
  );
}
