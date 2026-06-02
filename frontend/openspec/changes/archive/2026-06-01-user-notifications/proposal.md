## Why

The existing `useUserNotificationsSocket` hook only fires basic sonner toasts with no contextual data. Users need richer, context-aware notifications when auction events occur (outbid, won, lost). When viewing the auction page, a modal (not BottomSheet, but a new one in the middle of the user's screen) should surface detailed info [ if the user lost, a modal gonna show up with the following specs: UNFORTUNATELY, YOU LOST THE AUCTION. other user bought it, product card with image, title and final value, SEE SIMILAR AUCTIONS button. if the user won , a modal gonna show up with the following specs: CONGRATS! YOU WON THE AUCTION. product card with image, title and final value, CLICK HERE TO PAY button. if the user was outbid, a toast gonna show up with the following specs: Unfourtunately you were outbided. Make a new bid to win this auction! button MAKE NEW BID]. When elsewhere, a top-down toast notification should appear with the same slide animation pattern used by BottomSheet.

## What Changes

- Enhance `useUserNotificationsSocket` to parse full WebSocket payload (`auction_name`, `new_amount`, `your_position`, `final_amount`, `order_id`, `winner_name`)
- Add TypeScript types for all `WS /ws/user/{user_id}` message payloads
- Handle `pending_notifications` array on connect → process backlog
- Create a **NotificationModal** (Middle-Screen-Sheet-based) for in-page auction notifications (outbid/won/lost)
- Create a **NotificationToast** component with top-down slide animation matching Middle-Screen-Sheet-based's motion pattern
- Route notification display: modal when on auction page, toast when elsewhere
- Mount the hook globally in `App.tsx`

## Capabilities

### New Capabilities
- `notification-types`: TypeScript types + discriminated union for all user WS message payloads
- `notification-display`: NotificationModal + NotificationToast components + routing logic (modal vs toast based on current page)
- `notification-socket`: Enhanced `useUserNotificationsSocket` hook with full payload handling, pending_notifications processing, and global mount

### Modified Capabilities
_(none — no existing spec-level behavior changes)_

## Impact

- **Files**: `useUserNotificationsSocket.tsx`, `App.tsx`, new components under `shared/components/`
- **Dependencies**: Uses existing `react-use-websocket`, `sonner`, `@mantine/core`, `BottomSheet -> refactor this component to be more generic and be able to start in the middle of the page as well and not only in the bottom`
- **APIs**: Consumes `WS /ws/user/{user_id}` with `outbid`, `auction_won`, `auction_lost`, `pending_notifications` message types
- **UX**: Users now receive rich, contextual notifications globally, with appropriate display mode based on navigation context
