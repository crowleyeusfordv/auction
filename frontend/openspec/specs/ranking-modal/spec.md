# Ranking Modal

## Purpose
Defines the behavior for the live auction ranking modal.

## Requirements

### Requirement: Ranking modal opens as bottom sheet
The system SHALL display a ranking modal as a slide-up bottom sheet overlay when the user taps the RANKING button.

#### Scenario: Open ranking modal
- **WHEN** user taps the RANKING button on InteractiveCard
- **THEN** a bottom-sheet modal slides up with a semi-transparent overlay behind it

#### Scenario: Close ranking modal via overlay
- **WHEN** user taps the overlay area outside the modal
- **THEN** the modal slides down and closes

---

### Requirement: Display top 3 bidders
The system SHALL display the top 3 bidders ordered by position, showing position indicator, username, and bid amount for each.

#### Scenario: Auction has 3 or more bidders
- **WHEN** ranking modal opens with 3+ rankers
- **THEN** exactly 3 rows are displayed, each showing position medal (🥇/🥈/🥉), username, and bid amount formatted with currency symbol

#### Scenario: Auction has fewer than 3 bidders
- **WHEN** ranking modal opens with fewer than 3 rankers
- **THEN** only the available bidder rows are displayed (1 or 2 rows)

---

### Requirement: Show current user position when outside top 3
The system SHALL display a 4th row with the current user's position, username, and bid amount when the user is ranked below 3rd place.

#### Scenario: Current user is ranked 4th or lower
- **WHEN** ranking modal opens and current user's position > 3
- **THEN** a separator ("···") appears below the top 3 rows, followed by the user's row showing their numeric position, username, and bid amount

#### Scenario: Current user is in top 3
- **WHEN** ranking modal opens and current user's position ≤ 3
- **THEN** only the top 3 rows are displayed; the user's row is highlighted but no extra row is added

---

### Requirement: Highlight current user row
The system SHALL visually distinguish the current user's row from other bidders regardless of their position.

#### Scenario: Current user row styling
- **WHEN** ranking modal renders a row belonging to the current user
- **THEN** that row MUST have a distinct background color and bold text to differentiate it from other rows

---

### Requirement: Empty state
The system SHALL display a message when no bids have been placed.

#### Scenario: No bidders
- **WHEN** ranking modal opens with an empty rankers list
- **THEN** the modal displays "No bids yet" instead of ranking rows
