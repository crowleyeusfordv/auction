## Context

Current `useUserNotificationsSocket` fires bare sonner toasts ("You were outbid!", "You won!", "Auction lost.") with no payload data. No modal exists for in-page notifications. The `BottomSheet` component only supports bottom-anchored slide-up — needs refactoring into a generic `Sheet` that supports multiple positions (bottom, center).

Existing consumers of `BottomSheet`: `BidModal`, `RankingModal`, `OtherAuctionsModal` — all bottom-anchored. These will continue working via default props after the rename to `Sheet`.

Stack: React 18, Mantine v7, react-use-websocket, sonner, react-router.

## Goals / Non-Goals

**Goals:**
- Rich, contextual notification display with full WS payload data
- Refactor BottomSheet to be able to position in the middle of the page as well not only in the bottom as it is now. You can change the name for just Sheet
- Centered modal for won/lost when user is on the auction's live room page
- Toast for outbid when on auction page (with "MAKE NEW BID" action button)
- Top-down toast for all notification types when user is elsewhere
- Process `pending_notifications` backlog on WS connect
- Global mount — single hook instance in `App.tsx`

**Non-Goals:**
- Notification persistence/history UI
- Sound/vibration alerts
- Push notifications (browser Notification API)

## Decisions

### 1. Refactor `BottomSheet` → `Sheet`

**Decision**: Rename `BottomSheet` to `Sheet` and add a `position` prop to support both bottom-anchored and center-screen layouts.

New prop API:
```ts
interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  overlayOpacity?: number;    // default 0.4
  position?: 'bottom' | 'center';  // default 'bottom'
  transition?: MantineTransition;  // default: 'slide-up' for bottom, 'pop' for center
  children: React.ReactNode;
}
```

- `position="bottom"` (default) → same as current BottomSheet behavior (fixed bottom, `slide-up`, border-radius top)
- `position="center"` → centered flex container, `pop` transition, full border-radius
- Existing consumers (`BidModal`, `RankingModal`, `OtherAuctionsModal`) need zero changes — defaults preserve current behavior
- Same `Overlay` + dismiss pattern for both positions

### 2. Notification routing logic

**Decision**: Determine display mode by matching `location.pathname` against the auction's live room path.

```
if pathname matches /auctions/{notification.auction_id}/live-room:
  → outbid: custom toast with "MAKE NEW BID" button (in-page, not disruptive)
  → won/lost: centered Sheet modal (full-screen centered overlay)
else:
  → all types: sonner toast from top-center with slide-down
```

**Why toast for outbid even on-page?** Outbid is a frequent, non-terminal event. A modal would be disruptive mid-bidding. A toast with action button is less intrusive.

### 3. Notification state management

**Decision**: Use React state within the hook + a notification queue (array). No external store (zustand/context).

**Rationale**: Notifications are transient, fire-and-forget. No other component needs to read notification state. The hook manages its own queue, processes one at a time, and clears on dismiss.

State shape:
```ts
activeNotification: UserNotification | null  // currently displayed
notificationQueue: UserNotification[]         // pending
```

### 4. Type system — discriminated union

**Decision**: Single `UserNotification` discriminated union on `type` field.

```ts
type UserNotification =
  | { type: "outbid"; auction_id: string; auction_name: string; new_amount: number; your_position: number }
  | { type: "auction_won"; auction_id: string; auction_name: string; final_amount: number; order_id: string }
  | { type: "auction_lost"; auction_id: string; auction_name: string; winner_name: string; final_amount: number }
```

`pending_notifications` is `UserNotification[]`.

### 5. Component architecture

```
App.tsx
  └── NotificationProvider (hook + rendering)
        ├── Sheet (won/lost modals when on auction page)
        └── Custom toasts via sonner (outbid on-page + all types off-page)
```

**NotificationProvider**: A thin wrapper component mounted in `App.tsx` that calls `useUserNotificationsSocket()` and renders the appropriate UI. This avoids putting rendering logic inside a hook.

### 6. Won/Lost modal content

**Won modal:**
- Header: "CONGRATS! YOU WON THE AUCTION"
- ProductCard (image placeholder, auction_name, final_amount)
- CTA: "CLICK HERE TO PAY" → navigates to payment/order page

**Lost modal:**
- Header: "UNFORTUNATELY, YOU LOST THE AUCTION"
- Subtext: "Another user bought it"
- ProductCard (image placeholder, auction_name, final_amount)
- CTA: "SEE SIMILAR AUCTIONS" → navigates to /auctions

### 7. Toast styling (off-page)

Use sonner's custom toast with Mantine-styled content. Slide from top-center. Include:
- Auction name
- Event-specific message
- Action button (navigate to auction or auctions list)

## Risks / Trade-offs

- **[No product image in WS payload]** → WS messages don't include `image_url`. Modals will show a placeholder or generic auction icon. Could fetch image via API call on notification receipt if needed later.
  → Mitigation: Use a styled placeholder icon. Add `image_url` to WS payload in future backend iteration.

- **[Queue flooding]** → `pending_notifications` on reconnect could have many items.
  → Mitigation: Process queue with delay between items (3 seconds). Cap visible toasts. For modals, show only the most recent won/lost per auction.

- **[Race condition: user navigates away mid-modal]** → Modal could render on wrong page after navigation.
  → Mitigation: Modal checks `location.pathname` on render, not just on notification receipt. Auto-dismiss on route change.

- **[Heartbeat overhead]** → Already handled by existing 30s interval in the hook. No change needed.
