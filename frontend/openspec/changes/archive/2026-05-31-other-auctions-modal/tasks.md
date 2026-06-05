## 1. Foundation & Layout

- [x] 1.1 Create `OtherAuctionsModal.tsx` in `src/features/live-room/components/` and define props/interfaces (`SellerAuction`, `OtherAuctionsModalProps`).
- [x] 1.2 Implement the modal shell using Mantine's `Transition` (slide-up), `Overlay`, and `Paper` (bottom-sheet with rounded corners).
- [x] 1.3 Implement the Header section (Centered uppercase title "OTHER AUCTIONS FROM THE SELLER").
- [x] 1.4 Add the `SegmentedControl` filter with options: All, Ended, Upcoming, On Going.
- [x] 1.5 Add the Footer section with Mantine `Pagination` component.

## 2. Auction Data Rendering

- [x] 2.1 Implement the category section layout: left-aligned uppercase title followed by a Mantine `Divider`.
- [x] 2.2 Map auction data to `ProductCard` components reusing `ProductCard.Root`, `Image`, `Info`, `Title`, `Stats`, and `Stat`.
- [x] 2.3 Add conditional rendering for the "Watch" button inside the card: enabled/pink for 'ongoing', disabled for 'upcoming', and hidden for 'ended'.

## 3. Interactive Logic (Filter & Pagination)

- [x] 3.1 Implement filter state logic: when a specific filter is selected, non-matching category sections must be hidden entirely.
- [x] 3.2 Implement pagination logic: flatten the filtered list of auctions to ensure items flow continuously across pages, rendering exactly 4 items per page.
- [x] 3.3 Ensure the correct category titles and dividers are injected above the items when rendering the paginated list, even if a category spans multiple pages.
- [x] 3.4 Wire up the `SegmentedControl` onChange handler to reset pagination to page 1 whenever the filter changes.
- [x] 3.5 Wire up the `Pagination` component and ensure it's hidden when `totalPages` is 1.

## 4. Empty States & Polish

- [x] 4.1 Implement category empty state: if a category has no auctions, do not render its section title/divider.
- [x] 4.2 Implement the global empty state: if the filtered list is completely empty, display "There is no other auctions from this seller" and hide category sections.
- [x] 4.3 Wire up the `onWatch` callback on the "Watch" button click (ensure no visual state change happens after clicking).
- [x] 4.4 Wire up the `onPageChange` callback on pagination interaction.
