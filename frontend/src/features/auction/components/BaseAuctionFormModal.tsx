import { useState } from 'react';
import { Modal, TextInput, NumberInput, Checkbox, Button, Stack, Group, FileInput, Text, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
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
  const isMobile = useMediaQuery('(max-width: 48em)');

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
        media.setUploadError('请选择开始时间，或勾选立即开始。');
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
      media.setUploadError('处理失败，请重试。');
    }
  };

  const isFormPending = isPending || media.isUploading;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={title}
      size="lg"
      fullScreen={!!isMobile}
      centered={!isMobile}
      keepMounted
      styles={{
        content: {
          maxHeight: '100dvh',
        },
        body: {
          paddingBottom: isMobile ? 'max(env(safe-area-inset-bottom), 1rem)' : undefined,
        },
      }}
    >
      <Box
        mah={isMobile ? 'calc(100dvh - 5rem)' : 'calc(100dvh - 12rem)'}
        style={{
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack gap="md">
          <TextInput label="商品名称" {...register('productName')} error={errors.productName?.message} />
          <TextInput label="商品描述" {...register('description')} error={errors.description?.message} />
          
          <Group grow align="flex-start">
            <FileInput 
              label="商品图片（可选）"
              placeholder="选择要上传或替换的图片"
              accept="image/*" 
              value={media.imageFile} 
              onChange={media.handleImageChange} 
              clearable
            />
            <FileInput 
              label="商品视频（可选）"
              placeholder="选择要上传或替换的视频"
              accept="video/*" 
              value={media.videoFile} 
              onChange={media.handleVideoChange}
              clearable
            />
          </Group>
          <Text size="xs" c="dimmed">
            如果只上传视频，系统会自动从视频中生成封面图。
          </Text>
          {media.uploadError && <Text size="sm" c="red">{media.uploadError}</Text>}

          <Group grow>
            <Controller name="startingBid" control={control} render={({ field }) => <NumberInput label="起拍价" {...field} error={errors.startingBid?.message} />} />
            <Controller name="incrementValue" control={control} render={({ field }) => <NumberInput label="固定加价" {...field} error={errors.incrementValue?.message} />} />
            <Controller name="buyOutPrice" control={control} render={({ field }) => <NumberInput label="一口价" {...field} error={errors.buyOutPrice?.message} />} />
          </Group>

          <Controller name="baseDuration" control={control} render={({ field }) => <NumberInput label="基础时长（分钟）" {...field} error={errors.baseDuration?.message} />} />

          <Checkbox label="启用延时竞拍" checked={hasExtended} onChange={(e) => setHasExtended(e.currentTarget.checked)} />
          {hasExtended && (
            <Group grow>
              <Controller name="triggerSeconds" control={control} render={({ field }) => <NumberInput label="触发时间（结束前秒数）" {...field} error={errors.triggerSeconds?.message} />} />
              <Controller name="secondsExtended" control={control} render={({ field }) => <NumberInput label="延长秒数" {...field} error={errors.secondsExtended?.message} />} />
            </Group>
          )}

          <Stack gap="xs">
            <Checkbox
              label="立即开始"
              checked={startsImmediately}
              onChange={(event) => setStartsImmediately(event.currentTarget.checked)}
            />
            <Controller
              name="scheduledTimeToStart"
              control={control}
              render={({ field }) => (
                <TextInput
                  label="开始时间"
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
      </Box>
    </Modal>
  );
}
