## Why

The application needs a dedicated, interactive component for users to place bids during live auctions. This bid modal centralizes product information, current bid status, and bid increment controls into a single intuitive interface, allowing users to quickly and confidently participate in auctions.

## What Changes

- Create a new `BidModal` UI component.
- Display a countdown timer in the header.
- Show product details including image, name, highest bid, and the user's last bid.
- Add a status badge intersecting product and control cards.
- Implement bid value controls (+ / - buttons, fixed increment display).
- Add a "Confirm Bid" button.

## Capabilities

### New Capabilities
- `bid-modal`: The interactive modal interface for users to review product status and place bids with increment controls.

### Modified Capabilities

## Impact

- New UI components added to the component library or live room features.
- State management update for modal visibility and bid submission.
