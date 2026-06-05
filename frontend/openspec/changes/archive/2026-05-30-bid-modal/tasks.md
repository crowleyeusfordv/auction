## 1. Container and Base Layout

- [x] 1.1 Create `BidModal` component wrapper with fixed-width vertical container and rounded corners.
- [x] 1.2 Implement the speech bubble pointer on the top-left using absolute positioning.
- [x] 1.3 Add CSS animation for the modal to show up from bottom to top.

## 2. Header and Timer

- [x] 2.1 Create or integrate a `Timer` component.
- [x] 2.2 Style the timer to be horizontally centered at the very top, isolated above content boxes.

## 3. Product Information Card

- [x] 3.1 Create `ProductCard` layout inside the modal.
- [x] 3.2 Add image placeholder on the left side, maintaining equal margins.
- [x] 3.3 Add product name top-aligned to the right of the image.
- [x] 3.4 Add highest bid value placed below the product name.
- [x] 3.5 Add user's last bid value placed horizontally next to the highest bid.

## 4. Status Badge

- [x] 4.1 Create `StatusBadge` component with appropriate text (e.g., "¥100 above...").
- [x] 4.2 Position it horizontally centered, intersecting the top border of the `BidControlsCard` (half overlapping out, half inside).

## 5. Bid Controls and Confirmation

- [x] 5.1 Create `BidControlsCard` layout below the product box.
- [x] 5.2 Implement local state for pending bid value and increment/decrement logic.
- [x] 5.3 Add the minus button aligned to the left margin.
- [x] 5.4 Add the central pending bid value, vertically and horizontally centered between buttons.
- [x] 5.5 Add the plus button aligned to the right margin.
- [x] 5.6 Add "Fixed Increment" text centered below the pending bid value.
- [x] 5.7 Add full-width "Confirm Bid" button at the bottom of the card, triggering the submit action.
