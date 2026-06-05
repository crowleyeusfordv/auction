import { Modal, TextInput, NumberInput, Checkbox, Button, Stack, Select, Group } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAuction } from '../hooks/useAuctions';
import { useState } from 'react';

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
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  startingBid: z.number().min(0),
  incrementValue: z.number().min(0),
  buyOutPrice: z.number().min(0),
  currentBid: z.number().min(0),
  baseDuration: z.number().min(1),
  scheduledTimeToStart: z.string(),
  extendedDuration: z.object({
    trigger: z.number(),
    secondsAdded: z.number()
  }).optional()
});

export function CreateAuctionModal({ opened, onClose, sellerId }: { opened: boolean; onClose: () => void; sellerId: string }) {
  const [hasExtended, setHasExtended] = useState(false);
  const { mutate: createAuction, isPending } = useCreateAuction();

  const { register, handleSubmit, formState: { errors }, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      productName: '', description: '', imageUrl: '', startingBid: 0, incrementValue: 0,
      buyOutPrice: 0, currentBid: 0, baseDuration: 60, scheduledTimeToStart: 'now',
      extendedDuration: { trigger: 10, secondsAdded: 30 }
    }
  });

  const onSubmit = (data: any) => {
    const payload = { ...data, sellerId };
    
    if (!hasExtended) delete payload.extendedDuration;
    
    payload.scheduledTimeToStart = getNextOccurrenceISO(payload.scheduledTimeToStart);

    createAuction(payload, { onSuccess: onClose });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Auction" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput label="Name of the product" {...register('productName')} error={errors.productName?.message} />
          <TextInput label="Description" {...register('description')} error={errors.description?.message} />
          <TextInput label="Image URL" {...register('imageUrl')} error={errors.imageUrl?.message} />

          <Group grow>
            <Controller name="startingBid" control={control} render={({ field }) => <NumberInput label="Starting bid" {...field} error={errors.startingBid?.message} />} />
            <Controller name="incrementValue" control={control} render={({ field }) => <NumberInput label="Fixed increment" {...field} error={errors.incrementValue?.message} />} />
          </Group>
          <Group grow>
            <Controller name="buyOutPrice" control={control} render={({ field }) => <NumberInput label="Highest bid (buy-out)" {...field} error={errors.buyOutPrice?.message} />} />
            <Controller name="currentBid" control={control} render={({ field }) => <NumberInput label="Current bid" {...field} error={errors.currentBid?.message} />} />
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
