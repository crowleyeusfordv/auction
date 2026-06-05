import { Modal, TextInput, NumberInput, Checkbox, Button, Stack, Select, Group } from '@mantine/core';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateAuction } from '../hooks/useAuctions';
import { useState, useEffect } from 'react';
import type { SellerAuction } from '../seller/types/auction.seller';

function getNextOccurrenceISO(timeStr: string): string | null {
  if (!timeStr || timeStr === 'now') return null;

  // Se já vier no formato ISO do backend, retorna direto
  if (timeStr.includes('T')) return timeStr;

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
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  startingBid: z.coerce.number().min(0),
  incrementValue: z.coerce.number().min(0),
  buyOutPrice: z.coerce.number().min(0).optional().default(0),
  currentBid: z.coerce.number().min(0).optional().default(0),
  baseDuration: z.coerce.number().min(1),
  scheduledTimeToStart: z.string().nullable().optional(),
  extendedDuration: z.object({
    trigger: z.coerce.number(),
    secondsAdded: z.coerce.number()
  }).optional()
});

export function SellerEditAuctionModal({ opened, onClose, auction }: { opened: boolean; onClose: () => void; auction: SellerAuction | null }) {
  const [hasExtended, setHasExtended] = useState(false);
  const { mutate: updateSellerAuction, isPending } = useUpdateAuction();

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: '', description: '', imageUrl: '', startingBid: 0, incrementValue: 0,
      buyOutPrice: 0, currentBid: 0, baseDuration: 60, scheduledTimeToStart: 'now',
      extendedDuration: { trigger: 10, secondsAdded: 30 }
    }
  });

  useEffect(() => {
    if (auction) {
      reset({
        ...auction,
        extendedDuration: auction.extendedDuration || { trigger: 10, secondsAdded: 30 }
      });
      setHasExtended(!!auction.extendedDuration);
    }
  }, [auction, reset]);

  const onSubmit = (data: any) => {
    if (!auction) return;
    const payload = { ...data };

    if (!hasExtended) delete payload.extendedDuration;
    delete payload.currentBid;

    payload.scheduledTimeToStart = getNextOccurrenceISO(payload.scheduledTimeToStart);

    updateSellerAuction({ id: auction.id, updates: payload }, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: Error) => {
        toast.error(err.message || "An error occurred while updating.");
      }
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit SellerAuction" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">

          <TextInput label="Name of the product" {...register('productName')} error={errors.productName?.message as string} />
          <TextInput label="Description" {...register('description')} error={errors.description?.message as string} />
          <TextInput label="Image URL" {...register('imageUrl')} error={errors.imageUrl?.message as string} />

          <Group grow>
            <Controller name="startingBid" control={control} render={({ field }) => <NumberInput label="Starting bid" {...field} error={errors.startingBid?.message as string} />} />
            <Controller name="incrementValue" control={control} render={({ field }) => <NumberInput label="Increment value" {...field} error={errors.incrementValue?.message as string} />} />
          </Group>
          <Group grow>
            <Controller name="buyOutPrice" control={control} render={({ field }) => <NumberInput label="Highest bid (buy-out)" {...field} error={errors.buyOutPrice?.message as string} />} />
            <Controller name="currentBid" control={control} render={({ field }) => <NumberInput label="Current bid" {...field} error={errors.currentBid?.message as string} />} />
          </Group>

          <Controller name="baseDuration" control={control} render={({ field }) => <NumberInput label="Base duration (minutes)" {...field} error={errors.baseDuration?.message as string} />} />

          <Checkbox label="Extended duration" checked={hasExtended} onChange={(e) => setHasExtended(e.currentTarget.checked)} />
          {hasExtended && (
            <Group grow>
              <Controller name="extendedDuration.trigger" control={control} render={({ field }) => <NumberInput label="Trigger (seconds before finish)" {...field} error={errors.extendedDuration?.trigger?.message as string} />} />
              <Controller name="extendedDuration.secondsAdded" control={control} render={({ field }) => <NumberInput label="Seconds added" {...field} error={errors.extendedDuration?.secondsAdded?.message as string} />} />
            </Group>
          )}

          <Controller
            name="scheduledTimeToStart"
            control={control}
            render={({ field }) => (
              <Select
                label="When this gonna start"
                data={['now', '1am', '2am', '3am']}
                {...field}
                error={errors.scheduledTimeToStart?.message}
              />
            )}
          />

          <Button type="submit" loading={isPending} fullWidth mt="md">Save Changes</Button>
        </Stack>
      </form>
    </Modal>
  );
}
