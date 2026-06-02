## 1. Types & Routing

- [x] 1.1 Create `UserNotification` discriminated union type + payload shapes (camelCase) in `src/shared/types/notifications.ts`
- [x] 1.2 Add the new payment route `AUCTIONS.PAYMENT` (`/auctions/:auction_id/payment`) to `routes.ts`

## 2. Global State & Socket Hooks

- [x] 2.1 Create a Zustand auth store (`useAuthStore`) with `userId: string | null`. Use Zustand `persist` middleware to keep `userId` in localStorage so it survives F5. Migrate `userStorage.get` reads here.
- [x] 2.2 Update `useUserNotificationsSocket` to read `userId` from `useAuthStore`. Pass `null` as the WS URL when `userId` is null so the socket does not connect for unauthenticated users.
- [x] 2.3 Update `useAuctionSocket` to also read `userId` from `useAuthStore` instead of `userStorage.get`.
- [x] 2.4 Implement notification queue state (`activeNotification`, `notificationQueue`) within `useUserNotificationsSocket`
- [x] 2.5 Add sequential queue processing logic: each notification displays for 3 seconds, then the next is shown. If user dismisses early, show next immediately.
- [x] 2.6 Handle `pending_notifications` message: enqueue each item in `payload` array sequentially into the notification queue

## 3. Sheet Refactoring

- [x] 3.1 Rename file `BottomSheet.tsx` → `Sheet.tsx` and rename the exported component to `Sheet`
- [x] 3.2 Add `position: 'bottom' | 'center'` prop (default `'bottom'`) and `transition?: MantineTransition` prop (default `'slide-up'` for BOTH positions) to `Sheet`
- [x] 3.3 Implement `position="center"` layout: centered flex container, full border-radius, uses `slide-up` transition by default (not `pop`)
- [x] 3.4 Update imports in `BidModal`, `RankingModal`, and `OtherAuctionsModal` from `BottomSheet` → `Sheet`

## 4. Notification UI Components

- [x] 4.1 Create `WonNotificationModal` (using `<Sheet position="center">`) with: header "CONGRATS! YOU WON THE AUCTION", ProductCard (imageUrl, auctionName, finalAmount), "CLICK HERE TO PAY" button → navigates to `/auctions/{auctionId}/payment`
- [x] 4.2 Create `LostNotificationModal` (using `<Sheet position="center">`) with: header "UNFORTUNATELY, YOU LOST THE AUCTION", subtext "Another user bought it", ProductCard (imageUrl, auctionName, finalAmount), "SEE SIMILAR AUCTIONS" button → navigates to `/auctions`
- [x] 4.3 Create on-page outbid toast handler: sonner toast with "Unfortunately you were outbid. Make a new bid to win this auction!" + "MAKE NEW BID" button that only dismisses the toast (no navigation, no modal)
- [x] 4.4 Create off-page toast handlers for each type:
  - `outbid` → toast with "MAKE NEW BID" button → navigates to `/auctions/{auctionId}/live-room`
  - `auction_won` → toast with "PAY" button → navigates to `/auctions/{auctionId}/payment`
  - `auction_lost` → toast with "SEE SIMILAR AUCTIONS" button → navigates to `/auctions`
- [x] 4.5 Create `NotificationProvider` wrapper component that calls `useUserNotificationsSocket`, evaluates `location.pathname`, and renders the correct modal or toast based on notification type and current page

## 5. Integration

- [x] 5.1 Mount `NotificationProvider` in `App.tsx` inside `<Routes>` so it has access to `useLocation`
- [x] 5.2 Implement route-change auto-dismiss: when user navigates away from the auction page, close the active modal
- [x] 5.3 Verify WS connects on login, disconnects on logout (userId becomes null in Zustand store)
