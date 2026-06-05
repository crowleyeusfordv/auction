## Why

During a live auction, bidders have no visibility into their competitive position. Showing a ranking modal lets users see the top 3 bidders and their own standing, driving engagement and urgency to bid higher.

## What Changes

- New `RankingModal` component (slide-up bottom sheet, same pattern as `BidModal`)
- Displays top 3 bidders with position, username, and bid amount
- If current user is NOT in top 3 → shows a 4th row with their position (e.g., "#7 You — ¥800")
- If current user IS in top 3 → only shows the 3 rows (no duplicate)
- Wire `onClickRanking` in `InteractiveCard` to open `RankingModal`
- Ranking data sourced from auction WebSocket messages (real-time updates)

## Capabilities

### New Capabilities

- `ranking-modal`: Bottom-sheet modal displaying auction bid ranking — top 3 positions + current user position with conditional rendering logic

### Modified Capabilities

None

## Impact

- **Code**: New component in `src/features/live-room/components/RankingModal.tsx`
- **Integration**: `InteractiveCard` gains state + handler to open/close ranking modal
- **Data**: Requires ranked bidder list from auction WebSocket (`useAuctionSocket`) or passed as props
- **Dependencies**: No new deps — uses existing Mantine v9, react-icons, Transition/Overlay patterns from `BidModal`
