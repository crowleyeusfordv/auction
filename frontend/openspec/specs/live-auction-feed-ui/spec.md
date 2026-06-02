## ADDED Requirements

### Requirement: Layout Structure
The system SHALL provide a full-viewport layout for the live auction feed, divided into absolute positioned floating UI elements over a main media layer.

#### Scenario: Feed initialization
- **WHEN** the live auction feed page is loaded
- **THEN** it renders a full-screen vertical layout
- **THEN** the main background displays media (video or image)
- **THEN** floating UI elements overlay the media

### Requirement: Hamburger Menu
The system SHALL provide a hamburger menu icon in the top right corner.

#### Scenario: Menu rendering
- **WHEN** the feed is rendered
- **THEN** a hamburger menu button is visible in the top-right overlay

#### Scenario: Menu response
- **WHEN** the user clicks on the hamburger menu button
- **THEN** the menu should allow a onClick prop to be able to dispatch an action on click

### Requirement: Viewer Count
The system SHALL provide an indicator showing the number of buyers watching.

#### Scenario: Viewer count rendering
- **WHEN** the feed is rendered
- **THEN** a viewer count indicator is visible in the top-left or top area overlay

### Requirement: Interaction Card
The system SHALL provide a card for quick actions related to the auction, containing a product image, current price/bid info, a ranking button, and an other auctions button.

#### Scenario: Interaction card rendering
- **WHEN** the feed is rendered
- **THEN** a card is visible at the bottom right area
- **THEN** the card contains a product thumbnail
- **THEN** the card contains its current highest bid 
- **THEN** the card contains a "Bid" button 
- **THEN** the card contains a 'Ranking' button
- **THEN** the card contains an 'Other Auctions' button

### Requirement: Chatbox
The system SHALL provide a chatbox for displaying messages.

#### Scenario: Chatbox rendering
- **WHEN** the feed is rendered
- **THEN** a chatbox component is visible at the bottom left area
- **THEN** it reserves space for bot and user messages
- **THEN** it show the messages going up
- **THEN** it allows to send a message through an input at the bottom


### Requirement: Endless Feed Simulation
The system SHALL allow vertical scrolling between different simulated auction items.

#### Scenario: User scrolling
- **WHEN** the user swipes or scrolls vertically
- **THEN** the next/previous auction item comes into view
