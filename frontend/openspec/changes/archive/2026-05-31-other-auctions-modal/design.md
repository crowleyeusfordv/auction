## Context

The live-room feature currently has modal patterns (`BidModal`, `RankingModal`) using Mantine's `Transition` + `Overlay` + `Paper` for slide-up bottom sheets. The shared `ProductCard` compound component provides `Root`, `Image`, `Info`, `Title`, `Stats`, `Stat`, `Action`, `Badge` sub-components built on Mantine primitives. This modal displays other auctions from the same seller, grouped by status, with filtering and pagination.

## Goals / Non-Goals

**Goals:**
- Reusable modal component following existing bottom-sheet pattern (Overlay + Transition + Paper)
- Reuse existing `ProductCard` compound component for auction cards
- Filter by auction status: Ended, Upcoming, On Going
- Categorized sections with dividers  Ended, Upcoming, On Going
- Pagination at footer using mantine component
- "Watch" action button on on going cards. it gonna be disabled in upcoming cards and it wont show up in ended cards

**Non-Goals:**
- Backend API integration (data will be prop-driven / mock for now)
- WebSocket real-time updates for this modal
- Deep navigation into auction detail from this modal
- Actual watchlist persistence logic

## Decisions

### 1. Component Location → `src/features/live-room/components/OtherAuctionsModal.tsx`

Follows existing modal pattern alongside `BidModal.tsx` and `RankingModal.tsx` in the live-room feature. If later needed outside live-room, can be moved to shared.

**Alternatives considered:**
- `src/shared/components/` — premature; only live-room needs it now.

### 2. Modal Pattern → Overlay + Transition slide-up (same as RankingModal)

Consistent with `RankingModal` and `BidModal`: `Transition mounted={isOpen} transition="slide-up"` with fixed-position overlay.

### 3. Filter → Mantine `SegmentedControl`

Clean, built-in Mantine component. Values: `"all" | "ongoing" | "upcoming" | "ended"`. Default: `"all"` (show all categories). When filtered, only matching category section renders.

**Alternatives considered:**
- `Select` dropdown — less discoverable, layout spec shows inline control.
- Custom buttons — unnecessary; SegmentedControl matches the rounded-box spec.

### 4. Card Layout → Reuse `ProductCard` compound component

Each auction card:
```tsx
<ProductCard>
  <ProductCard.Image src={auction.image} />
  <ProductCard.Info>
    <ProductCard.Title>{auction.name}</ProductCard.Title>
    <ProductCard.Stats>
      <ProductCard.Stat label="Highest Bid:" value={`¥${auction.highestBid}`} />
      <ProductCard.Stat label="My last bid:" value={`¥${auction.myLastBid}`} />
    </ProductCard.Stats>
    <ProductCard.Action color="pink" style={{ position: 'absolute', bottom: 8, right: 8 }}>
      Watch
    </ProductCard.Action>
  </ProductCard.Info>
</ProductCard>
```

### 5. Section Layout → Category title + Mantine `Divider` + card list

Each category section: `Text` (left-aligned, uppercase, bold) → `Divider` → list of `ProductCard`.

### 6. Pagination → Simple page controls (prev/next + page number)

Props: `page`, `totalPages`, `onPageChange`. Rendered as centered `Group` with `ActionIcon` arrows and page text.

### 7. Data Interface

```ts
interface SellerAuction {
  id: string;
  name: string;
  image: string;
  highestBid: number;
  myLastBid: number;
  status: 'ongoing' | 'upcoming' | 'ended';
}

interface OtherAuctionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctions: SellerAuction[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onWatch: (auctionId: string) => void;
}
```

Data fetching / state management deferred to consumer. Modal is purely presentational.

## Risks / Trade-offs

- **Large auction lists** → Pagination mitigates, but no virtualization. Acceptable for expected dataset sizes.
- **ProductCard positioning** → `Action` button needs absolute positioning within a relative container. `ProductCard.Root` already uses `pos="relative"`, so this works.
- **Filter + category sections** → When filter is active, empty categories are hidden entirely, not shown empty. Simple `.filter()` before render.
