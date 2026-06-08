import { z } from 'zod';

export const auctionFormSchema = z.object({
  sellerId: z.uuid(),
  productName: z.string().min(1, '必填'),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
  videoUrl: z.string().optional().or(z.literal('')),
  startingBid: z.coerce.number().positive('必须大于 0'),
  incrementValue: z.coerce.number().positive('必须大于 0'),
  buyOutPrice: z.coerce.number().min(0),
  baseDuration: z.coerce.number().min(1).positive('必须大于 1'),
  scheduledTimeToStart: z.string().nullable().optional(),
  isExtendedDuration: z.boolean().optional(),
  triggerSeconds: z.coerce.number().min(1).positive('必须大于 0').optional(),
  secondsExtended: z.coerce.number().min(1).positive('必须大于 0').optional()
}).refine(data => data.buyOutPrice === 0 || data.buyOutPrice >= data.startingBid, {
  message: "一口价必须大于或等于起拍价（填 0 表示禁用）",
  path: ["buyOutPrice"]
});

export type AuctionFormData = z.infer<typeof auctionFormSchema>;
