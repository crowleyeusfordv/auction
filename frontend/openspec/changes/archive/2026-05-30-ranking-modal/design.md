## Context

The live auction room (`live-room` feature) already uses a bottom-sheet modal pattern via `BidModal` — Mantine `Transition` + `Overlay` + fixed `Paper` with rounded top corners. `InteractiveCard` already exposes an `onClickRanking` prop wired to a RANKING button but has no handler implementation yet.

Tech: React 19, Mantine v9, react-icons, Vite. Data arrives via `useAuctionSocket` WebSocket hook.

## Goals / Non-Goals

**Goals:**
- Reusable `RankingModal` component following `BidModal`'s slide-up pattern
- Show top 3 bidders (position medal/number, username, bid amount)
- Conditionally show current user's row if outside top 3
- Accept ranking data as props (decoupled from data source)

**Non-Goals:**
- Real-time WebSocket integration (data fetching is caller's responsibility)
- Pagination or showing full leaderboard
- Bid actions from within ranking modal

## Decisions

### 1. Component pattern → Bottom-sheet with Transition/Overlay (same as BidModal)

**Rationale**: Consistent UX, proven pattern in codebase, no new dependencies.

**Alternatives considered**:
- Mantine `Drawer` — heavier, less control over animation, different visual style
- Mantine `Modal` — centered overlay doesn't fit mobile-first auction UX

### 2. Props-driven data → `RankingModal` receives `rankers[]` + `currentUserId`

**Rationale**: Keeps component pure/testable. Parent wires WebSocket data. Same pattern as `BidModal` receiving `highestBid` etc.

**Interface**:
```ts
interface Ranker {
  userId: string;
  username: string;
  bidAmount: number;
  position: number;
}

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankers: Ranker[];       // full sorted list (or at least top N + user)
  currentUserId: string;
}
```

### 3. Display logic → derive from props

- Extract `top3` = `rankers.slice(0, 3)`
- Find `userRanker` = `rankers.find(r => r.userId === currentUserId)`
- If `userRanker` exists and `userRanker.position > 3` → render 4th row with separator
- If `userRanker` is in top 3 → no extra row, highlight their row

### 4. Visual differentiation → medals for 1st/2nd/3rd, highlight for current user

- Position 1: 🥇, Position 2: 🥈, Position 3: 🥉
- Current user row gets a distinct background (`blue.0` or `blue.1`) + bold text
- Rows outside top 3 get a "···" separator before them

## Risks / Trade-offs

- **[Stale data]** → Ranking shown may lag behind real-time bids. Mitigation: parent re-renders with fresh WebSocket data; modal re-renders reactively.
- **[Tied bids]** → Multiple users at same amount. Mitigation: backend determines position order; frontend just renders `position` field as-is.
- **[Empty state]** → No bids yet. Mitigation: if `rankers` is empty, show "No bids yet" message instead of empty modal.
