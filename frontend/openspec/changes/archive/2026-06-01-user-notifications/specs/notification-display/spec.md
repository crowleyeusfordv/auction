## ADDED Requirements

### Requirement: Sheet component supports center position
The `Sheet` component (refactored from `BottomSheet`) MUST accept a `position` prop with values `"bottom"` (default) and `"center"`. It MUST also accept an optional `transition` prop.

#### Scenario: Bottom position (default behavior)
- **WHEN** `Sheet` is rendered without a `position` prop
- **THEN** it MUST render fixed to the bottom of the viewport with `slide-up` transition and top border-radius

#### Scenario: Center position
- **WHEN** `Sheet` is rendered with `position="center"`
- **THEN** it MUST render centered in the viewport with `slide-up` transition and full border-radius

#### Scenario: Existing consumers unaffected
- **WHEN** `BidModal`, `RankingModal`, or `OtherAuctionsModal` use `Sheet` without passing `position`
- **THEN** the behavior MUST be identical to the previous `BottomSheet` component

### Requirement: Won notification modal
When user is on the auction's live room page and receives an `auction_won` notification, the system MUST display a centered `Sheet` modal.

#### Scenario: Won modal content
- **WHEN** an `auction_won` notification is received and user is on `/auctions/{auction_id}/live-room`
- **THEN** the modal MUST display:
  - Header text: "CONGRATS! YOU WON THE AUCTION"
  - Product card with auction name and final amount
  - A "CLICK HERE TO PAY" button

#### Scenario: Won modal pay action
- **WHEN** user clicks "CLICK HERE TO PAY"
- **THEN** the modal MUST close and navigate to the payment/order page ('/auctions/{auctionId}/payment') and this new route MUST be added to `routes.ts`

### Requirement: Lost notification modal
When user is on the auction's live room page and receives an `auction_lost` notification, the system MUST display a centered `Sheet` modal.

#### Scenario: Lost modal content
- **WHEN** an `auction_lost` notification is received and user is on `/auctions/{auction_id}/live-room`
- **THEN** the modal MUST display:
  - Header text: "UNFORTUNATELY, YOU LOST THE AUCTION"
  - Subtext: "Another user bought it"
  - Product card with auction name and final amount
  - A "SEE SIMILAR AUCTIONS" button

#### Scenario: Lost modal similar auctions action
- **WHEN** user clicks "SEE SIMILAR AUCTIONS"
- **THEN** the modal MUST close and navigate to `/auctions`

### Requirement: Outbid toast on auction page
When user is on the auction's live room page and receives an `outbid` notification, the system MUST display a toast (not a modal).

#### Scenario: Outbid toast content on-page
- **WHEN** an `outbid` notification is received and user is on `/auctions/{auction_id}/live-room`
- **THEN** a toast MUST appear with message "Unfortunately you were outbid. Make a new bid to win this auction!" and a "MAKE NEW BID" action button

#### Scenario: Outbid make new bid action
- **WHEN** user clicks "MAKE NEW BID" on the outbid toast
- **THEN** the toast MUST dismiss (no modal opening required)

### Requirement: Off-page toast notifications
When user is NOT on the auction's live room page, all notification types MUST display as top-down toasts.

#### Scenario: Off-page outbid toast
- **WHEN** an `outbid` notification is received and user is NOT on the auction's live room page
- **THEN** a toast MUST slide in from top-center with auction name, outbid message, and a "MAKE NEW BID" action button. Clicking the button MUST navigate to `/auctions/{auction_id}/live-room`.

#### Scenario: Off-page won toast
- **WHEN** an `auction_won` notification is received and user is NOT on the auction's live room page
- **THEN** a toast MUST slide in from top-center with auction name, won message, and a "PAY" action button. Clicking the button MUST navigate to `/auctions/{auction_id}/payment`.

#### Scenario: Off-page lost toast
- **WHEN** an `auction_lost` notification is received and user is NOT on the auction's live room page
- **THEN** a toast MUST slide in from top-center with auction name, lost message, and a "SEE SIMILAR AUCTIONS" action button. Clicking the button MUST navigate to `/auctions`.

### Requirement: Modal auto-dismiss on route change
Notification modals MUST auto-dismiss when the user navigates away from the auction page.

#### Scenario: Route change dismisses modal
- **WHEN** a won/lost modal is visible and user navigates to a different route
- **THEN** the modal MUST close automatically
