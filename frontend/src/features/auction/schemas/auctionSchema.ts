import { z } from 'zod';

export const auctionFormSchema = z.object({
  sellerId: z.uuid(),
  productName: z.string().min(1, 'Required'),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  videoUrl: z.string().optional().or(z.literal('')),
  startingBid: z.coerce.number().positive('Must be greater than 0'),
  incrementValue: z.coerce.number().positive('Must be greater than 0'),
  buyOutPrice: z.coerce.number().min(0),
  baseDuration: z.coerce.number().min(1).positive('Must be greater than 1'),
  scheduledTimeToStart: z.string().nullable().optional(),
  isExtendedDuration: z.boolean().optional(),
  triggerSeconds: z.coerce.number().min(1).positive('Must be greater than 0').optional(),
  secondsExtended: z.coerce.number().min(1).positive('Must be greater than 0').optional()
}).refine(data => data.buyOutPrice === 0 || data.buyOutPrice >= data.startingBid, {
  message: "Buyout price must be greater than or equal to starting bid (or 0 to disable)",
  path: ["buyOutPrice"]
});

export type AuctionFormData = z.infer<typeof auctionFormSchema>;
