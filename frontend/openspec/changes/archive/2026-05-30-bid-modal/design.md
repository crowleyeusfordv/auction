## Context

The live auction room requires a fluid, interactive modal to enable fast bidding. The modal must centralize product information, current bid status, and bid increment controls. It must be visually distinct (e.g., speech bubble pointer) and organize information hierarchically (product info -> status -> controls).

## Goals / Non-Goals

**Goals:**
- Provide a clean, centralized interface for viewing product status and placing bids.
- Implement incremental value controls with fixed increments.
- Ensure specific UI touches like the overlapping status badge and speech bubble pointer.

**Non-Goals:**
- Implement real-time bid processing logic in the backend.
- Modify the overall layout of the live room page outside of launching this modal.

## Decisions

- **Modal Structure**: Fixed-width vertical container with rounded corners. Use absolute positioning for the speech bubble pointer to give it a "popover" feel.
- **Component Hierarchy**:
  - `Timer`: Countdown timer.
  - `ProductCard`: Flex layout for image, title, highest bid, last bid.
  - `StatusBadge`: Absolute positioned element intersecting the `ProductCard` and `BidControlsCard`.
  - `BidControlsCard`: - left button, + right button, main bid value display, increment info, and "Confirm Bid" button.
- **State Management**: Use local state for the pending bid value (increment/decrement). The final value is emitted to the parent only on "Confirm Bid". 

## Risks / Trade-offs

- **Risk**: Overlapping elements (StatusBadge) can cause z-index or layout issues on smaller screens. -> **Mitigation**: Use precise absolute positioning and ensure parent container has `position: relative`.
- **Trade-off**: Local vs global state for pending bid. Local state avoids full-page re-renders during increment/decrement actions.
