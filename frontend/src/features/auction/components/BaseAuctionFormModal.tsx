import { useState } from 'react';
import { Modal, TextInput, NumberInput, Checkbox, Button, Stack, Group, FileInput, Text } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { auctionFormSchema, type AuctionFormData } from '../schemas/auctionSchema';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { toAuctionStartISO } from '../utils/dateTime';

export interface BaseAuctionFormModalProps {
  title: string;
  submitLabel: string;
  initialValues: AuctionFormData;
  onSubmit: (payload: AuctionFormData) => void;
  isPending: boolean;
  opened: boolean;
  onClose: () => void;
}

export function BaseAuctionFormModal({ title, submitLabel, initialValues, onSubmit, isPending, opened, onClose }: BaseAuctionFormModalProps) {
  const [hasExtended, setHasExtended] = useState(!!initialValues.isExtendedDuration);
  const [startsImmediately, setStartsImmediately] = useState(!initialValues.scheduledTimeToStart || initialValues.scheduledTimeToStart === 'now');
  const media = useMediaUpload();

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm<AuctionFormData>({
    resolver: zodResolver(auctionFormSchema) as any,
    defaultValues: initialValues
  });

  const handleClose = () => {
    reset();
    media.resetMedia();
    setStartsImmediately(!initialValues.scheduledTimeToStart || initialValues.scheduledTimeToStart === 'now');
    onClose();
  };

  const handleFormSubmit = async (data: AuctionFormData) => {
    try {
      if (!startsImmediately && !data.scheduledTimeToStart) {
        media.setUploadError('Please choose a start time or start immediately.');
        return;
      }

      const { imageUrl, videoUrl } = await media.uploadMedia();
      
      const payload: any = { ...data };
      
      if (imageUrl) payload.imageUrl = imageUrl;
      if (videoUrl) payload.videoUrl = videoUrl;

      payload.isExtendedDuration = hasExtended;
      if (!hasExtended) {
        delete payload.triggerSeconds;
        delete payload.secondsExtended;
      }

      payload.scheduledTimeToStart = startsImmediately ? null : toAuctionStartISO(payload.scheduledTimeToStart);

      onSubmit(payload);
    } catch (error) {
      console.error('Submit failed:', error);
      media.setUploadError('Failed to process. Please try again.');
    }
  };

  const isFormPending = isPending || media.isUploading;

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg">
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack gap="md">
          <TextInput label="Name of the product" {...register('productName')} error={errors.productName?.message} />
          <TextInput label="Description" {...register('description')} error={errors.description?.message} />
          
          <Group grow align="flex-start">
            <FileInput 
              label="Product Image (Optional)" 
              placeholder="Select an image to upload/replace"
              accept="image/*" 
              value={media.imageFile} 
              onChange={media.handleImageChange} 
              clearable
            />
            <FileInput 
              label="Product Video (Optional)" 
              placeholder="Select a video to upload/replace"
              accept="video/*" 
              value={media.videoFile} 
              onChange={media.handleVideoChange}
              clearable
            />
          </Group>
          <Text size="xs" c="dimmed">
            If you only upload a video, a cover image will be automatically generated from it.
          </Text>
          {media.uploadError && <Text size="sm" c="red">{media.uploadError}</Text>}

          <Group grow>
            <Controller name="startingBid" control={control} render={({ field }) => <NumberInput label="Starting bid" {...field} error={errors.startingBid?.message} />} />
            <Controller name="incrementValue" control={control} render={({ field }) => <NumberInput label="Fixed increment" {...field} error={errors.incrementValue?.message} />} />
            <Controller name="buyOutPrice" control={control} render={({ field }) => <NumberInput label="Highest bid (buy-out)" {...field} error={errors.buyOutPrice?.message} />} />
          </Group>

          <Controller name="baseDuration" control={control} render={({ field }) => <NumberInput label="Base duration (minutes)" {...field} error={errors.baseDuration?.message} />} />

          <Checkbox label="Extended duration" checked={hasExtended} onChange={(e) => setHasExtended(e.currentTarget.checked)} />
          {hasExtended && (
            <Group grow>
              <Controller name="triggerSeconds" control={control} render={({ field }) => <NumberInput label="Trigger (seconds before finish)" {...field} error={errors.triggerSeconds?.message} />} />
              <Controller name="secondsExtended" control={control} render={({ field }) => <NumberInput label="Seconds added" {...field} error={errors.secondsExtended?.message} />} />
            </Group>
          )}

          <Stack gap="xs">
            <Checkbox
              label="Start immediately"
              checked={startsImmediately}
              onChange={(event) => setStartsImmediately(event.currentTarget.checked)}
            />
            <Controller
              name="scheduledTimeToStart"
              control={control}
              render={({ field }) => (
                <TextInput
                  label="Start time"
                  type="datetime-local"
                  step={60}
                  disabled={startsImmediately}
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  error={!startsImmediately ? errors.scheduledTimeToStart?.message : undefined}
                />
              )}
            />
          </Stack>

          <Button type="submit" loading={isFormPending} fullWidth mt="md">
            {submitLabel}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
