## ADDED Requirements

### Requirement: Modal display
The system SHALL display a  bottom-sheet modal with title "OTHER AUCTIONS FROM THE SELLER" (centered, uppercase, two lines) when triggered.

#### Scenario: Modal opens
- **WHEN** user triggers the other-auctions modal
- **THEN** an overlay with fade transition MUST appear
- **AND** a bottom-sheet panel MUST slide up with rounded top corners

#### Scenario: Modal closes
- **WHEN** user taps the overlay
- **THEN** the modal MUST close with reverse transitions

---

### Requirement: Filter control
The system SHALL display a centered filter control below the title with options: All, Ended, Upcoming, On Going.

#### Scenario: Default filter state
- **WHEN** the modal opens
- **THEN** filter MUST default to "All" showing all category sections

#### Scenario: Filter by status
- **WHEN** user selects a specific filter (e.g. "On Going")
- **THEN** only the matching category section MUST be displayed
- **AND** non-matching category sections MUST be hidden entirely

#### Scenario: Reset pagination on filter change
- **WHEN** user changes the filter selection
- **THEN** the pagination MUST reset to page 1

---

### Requirement: Categorized sections
The system SHALL group auctions into three sections in this order: On Going, Upcoming, Ended.

#### Scenario: Section structure
- **GIVEN** auctions exist for a category
- **WHEN** the section renders
- **THEN** a left-aligned uppercase category title MUST appear
- **AND** a horizontal divider line MUST appear below the title
- **AND** auction product cards MUST appear below the divider

#### Scenario: Empty category
- **GIVEN** no auctions exist for a category
- **WHEN** the modal renders
- **THEN** that category section MUST NOT be displayed

---

### Requirement: Auction product card
Each auction MUST be displayed as a card with: product image (left, square, rounded), product name (top right of image), bid stats (two columns: "Highest Bid:" and "My last bid:" with yen values), and a conditional "Watch" action button.

#### Scenario: Card layout
- **GIVEN** an auction item
- **WHEN** the card renders
- **THEN** the product image MUST appear on the left as a square with rounded corners
- **AND** the product name MUST appear to the right of the image, top-aligned
- **AND** "Highest Bid:" and "My last bid:" MUST appear as two columns below the name
- **AND** the "Watch" button SHALL appear conditionally based on auction status

---

### Requirement: Watch button behavior
The "Watch" button SHALL appear conditionally based on auction status.

#### Scenario: On Going auction
- **GIVEN** an auction with status "ongoing"
- **WHEN** the card renders
- **THEN** a "Watch" button MUST appear in the bottom-right corner
- **AND** the button MUST be enabled and clickable

#### Scenario: Watch button click
- **WHEN** user clicks the enabled "Watch" button
- **THEN** the `onWatch` callback MUST be invoked
- **AND** the button MUST NOT change visual state (no loading or "watched" state)

#### Scenario: Upcoming auction
- **GIVEN** an auction with status "upcoming"
- **WHEN** the card renders
- **THEN** a "Watch" button MUST appear in the bottom-right corner
- **AND** the button MUST be disabled (not clickable)

#### Scenario: Ended auction
- **GIVEN** an auction with status "ended"
- **WHEN** the card renders
- **THEN** no "Watch" button SHALL be displayed

---

### Requirement: Pagination
The system SHALL display pagination controls centered at the bottom of the modal.

#### Scenario: Maximum items per page
- **GIVEN** a list of auctions
- **WHEN** the list is rendered on a page
- **THEN** no more than 4 auctions MUST be displayed per page
- **AND** items MUST flow continuously across pages (e.g., if page 1 ends with ongoing, page 2 can start with remaining ongoing followed by upcoming)

#### Scenario: Navigate pages
- **WHEN** user interacts with pagination controls
- **THEN** the `onPageChange` callback MUST be invoked with the target page number

#### Scenario: Single page
- **GIVEN** totalPages is 1
- **WHEN** the modal renders
- **THEN** pagination controls MUST NOT  be visible

---

### Requirement: Global empty state
The system SHALL display a fallback message when there are no auctions to show for the current filter.

#### Scenario: No auctions match filter
- **GIVEN** 0 auctions match the currently selected filter (or 0 total)
- **WHEN** the modal body renders
- **THEN** the text "There is no other auctions from this seller" MUST be displayed
- **AND** no category sections or product cards MUST be rendered
