## 1. Ranking Modal Component Structure

- [x] 1.1 Create `src/features/live-room/components/RankingModal.tsx` file and scaffold component
- [x] 1.2 Define `Ranker` and `RankingModalProps` interfaces in the file
- [x] 1.3 Implement bottom-sheet slide-up UI pattern using Mantine `Transition`, `Overlay`, and `Paper` (reference `BidModal.tsx`)

## 2. Ranking Modal Display Logic

- [x] 2.1 Implement empty state ("No bids yet" message when `rankers` is empty)
- [x] 2.2 Implement top 3 display logic with position medals (🥇/🥈/🥉) and formatted currency
- [x] 2.3 Implement conditional 4th row logic for current user (when outside top 3, separated by "···")
- [x] 2.4 Apply distinct styling (background color, bold text) for the current user's row regardless of position

## 3. InteractiveCard Integration

- [x] 3.1 Import `RankingModal` into `InteractiveCard.tsx`
- [x] 3.2 Add `isRankingModalOpen` state to `InteractiveCard`
- [x] 3.3 Wire `onClickRanking` prop to open the modal
- [x] 3.4 Pass mock ranking data to `RankingModal` to test UI
