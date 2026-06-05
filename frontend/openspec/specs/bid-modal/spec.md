# Capability: bid-modal

## Purpose
TBD

## Requirements

### Requirement: Modal Layout and Styling
The bid modal MUST render a vertical container with rounded corners and a speech bubble pointer on the top-left to indicate it is a pop-over element.

#### Scenario: Displaying the Modal
- **WHEN** the user triggers the bid modal
- **THEN** it renders with the defined rounded rectangular shape and speech bubble pointer
- **THEN** it shows up from the bottom to the top

### Requirement: Countdown Timer
The modal MUST display a countdown timer horizontally centered at the very top of the screen, isolated above the content boxes.

#### Scenario: Timer Visibility
- **WHEN** the modal is open
- **THEN** the remaining auction time is clearly visible and horizontally centered at the top

### Requirement: Product Information Card
The modal MUST include a Product Information Card positioned below the timer, containing an image placeholder, product title, highest bid, and the user's last bid.

#### Scenario: Rendering Product Details
- **WHEN** the modal is open
- **THEN** the image is aligned to the left, product title top-aligned to the right, highest bid below title (left), and last bid next to highest bid (right)

### Requirement: Status Badge Intersection
The modal MUST display a Status Badge (e.g., "¥100 above...") that is horizontally centered and overlaps the dividing line between the Product Information Card and the Bid Controls Card.

#### Scenario: Badge Positioning
- **WHEN** the modal renders the product and control cards
- **THEN** the status badge visually show up placed in the top-centered border of the Bid controls container. Half of its size gonna stay overflowing and half inside de container

### Requirement: Bid Controls and Confirmation
The modal MUST provide a Bid Controls Card containing a minus button, a central pending bid value, a plus button, fixed increment text, and a full-width "Confirm Bid" button at the bottom.

#### Scenario: Adjusting Bid
- **WHEN** the user clicks the plus or minus buttons
- **THEN** the central pending bid value increases or decreases by the fixed increment amount

#### Scenario: Confirming Bid
- **WHEN** the user clicks the "Confirm Bid" button
- **THEN** the modal submits the pending bid value
