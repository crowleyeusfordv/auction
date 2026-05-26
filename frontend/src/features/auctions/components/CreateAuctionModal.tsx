import { Modal, TextInput, NumberInput, Checkbox, Button, Stack, Select, Group } from '@mantine/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateAuction } from '../hooks/useAuctions';
import { useState } from 'react';

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

export function CreateAuctionModal({ opened, onClose, sellerId }: { opened: boolean; onClose: () => void; sellerId: string }) {
  const [hasExtended, setHasExtended] = useState(false);
  const { mutate: createAuction, isPending } = useCreateAuction();

  const { register, handleSubmit, formState: { errors }, control } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', image: '', startingBid: 0, fixedIncrement: 0,
      highestBid: 0, currentBid: 0, baseDuration: 60, startTime: 'now',
      extendedDuration: { trigger: 10, secondsAdded: 30 }
    }
  });

  const onSubmit = (data: any) => {
    const payload = { ...data, sellerId };
    if (!hasExtended) delete payload.extendedDuration;
    createAuction(payload, { onSuccess: onClose });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create Auction" size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="md">
          <TextInput label="Name of the product" {...register('name')} error={errors.name?.message} />
          <TextInput label="Description" {...register('description')} error={errors.description?.message} />
          <TextInput label="Image URL" {...register('image')} error={errors.image?.message} />

          <Group grow>
            <Controller name="startingBid" control={control} render={({ field }) => <NumberInput label="Starting bid" {...field} error={errors.startingBid?.message} />} />
            <Controller name="fixedIncrement" control={control} render={({ field }) => <NumberInput label="Fixed increment" {...field} error={errors.fixedIncrement?.message} />} />
          </Group>
          <Group grow>
            <Controller name="highestBid" control={control} render={({ field }) => <NumberInput label="Highest bid (buy-out)" {...field} error={errors.highestBid?.message} />} />
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
            name="startTime"
            control={control}
            render={({ field }) => (
              <Select
                label="When this gonna start"
                data={['now', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm']}
                {...field}
                error={errors.startTime?.message}
              />
            )}
          />

          <Button type="submit" loading={isPending} fullWidth mt="md">Create Auction</Button>
        </Stack>
      </form>
    </Modal>
  );
}
