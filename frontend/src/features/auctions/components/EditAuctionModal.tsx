import { Modal, TextInput, NumberInput, Checkbox, Button, Stack, Select, Group } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateAuction } from '../hooks/useAuctions';
import type { Auction } from '../types/auction';
import { useState, useEffect } from 'react';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  startingBid: z.number().min(0),
  fixedIncrement: z.number().min(0),
  highestBid: z.number().min(0),
  currentBid: z.number().min(0),
  baseDuration: z.number().min(1),
  startTime: z.string(),
  extendedDuration: z.object({
    trigger: z.number(),
    secondsAdded: z.number()
  }).optional()
});

export function EditAuctionModal({ opened, onClose, auction }: { opened: boolean; onClose: () => void; auction: Auction | null }) {
  const [hasExtended, setHasExtended] = useState(false);
  const { mutate: updateAuction, isPending } = useUpdateAuction();

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', image: '', startingBid: 0, fixedIncrement: 0,
      highestBid: 0, currentBid: 0, baseDuration: 60, startTime: 'now',
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
    updateAuction({ id: auction.id, updates: payload }, { onSuccess: onClose });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Auction" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput label="Name of the product" {...register('name')} error={errors.name?.message as string} />
          <TextInput label="Description" {...register('description')} error={errors.description?.message as string} />
          <TextInput label="Image URL" {...register('image')} error={errors.image?.message as string} />

          <Group grow>
            <Controller name="startingBid" control={control} render={({ field }) => <NumberInput label="Starting bid" {...field} error={errors.startingBid?.message as string} />} />
            <Controller name="fixedIncrement" control={control} render={({ field }) => <NumberInput label="Fixed increment" {...field} error={errors.fixedIncrement?.message as string} />} />
          </Group>
          <Group grow>
            <Controller name="highestBid" control={control} render={({ field }) => <NumberInput label="Highest bid (buy-out)" {...field} error={errors.highestBid?.message as string} />} />
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
            name="startTime"
            control={control}
            render={({ field }) => (
              <Select
                label="When this gonna start"
                data={['now', '1am', '2am', '3am']}
                {...field}
                error={errors.startTime?.message as string}
              />
            )}
          />

          <Button type="submit" loading={isPending} fullWidth mt="md">Save Changes</Button>
        </Stack>
      </form>
    </Modal>
  );
}
