## Why

Users need a way to browse and filter other auctions from the same seller to increase engagement and discoverability of related items. This modal provides a structured, paginated view categorized by auction status.

## What Changes

- Create a new modal component for displaying other auctions from a seller.
- Implement a filter control for auction statuses (Ended, Upcoming, On Going).
- Display categorized lists of auctions with a specific product card layout (Image, Name, Bids, "Watch" button).
- Include pagination controls.

## Capabilities

### New Capabilities
- `other-auctions-modal`: A modal interface to display, filter, and paginate through other auctions by a specific seller, grouped by status.

### Modified Capabilities

## Impact

- **UI Components**: New modal component and specialized product card layout.
- **State Management**: Modal visibility and pagination state.
