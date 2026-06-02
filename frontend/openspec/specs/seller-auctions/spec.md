# Seller Auctions

## Purpose
TBD

## Requirements

### Requirement: List Seller Auctions
The system MUST fetch and display the seller's auctions by calling `GET /auctions?seller_id={seller_id}`.

#### Scenario: View auctions
- **GIVEN** a seller is on the "My Auctions" page
- **WHEN** the page loads
- **THEN** it MUST display a list of their auctions showing product image, name, starting bid, fixed increment, highest bid, current bid, times people gave a bid, and status.

### Requirement: Create Auction
The system MUST allow sellers to create an auction via a modal and submit to `POST /auctions`.

#### Scenario: Submit new auction
- **GIVEN** the seller opens the "Create Auction" modal
- **WHEN** they fill required fields (starting bid, product info, duration) and submit
- **THEN** the system MUST call `POST /auctions` and close the modal

### Requirement: Edit Auction
The system MUST allow sellers to edit an auction via a modal and submit to `PUT /auctions/{auction_id}`.

#### Scenario: Edit existing auction
- **GIVEN** the seller clicks edit on a specific auction
- **WHEN** they modify the fields in the modal and submit
- **THEN** the system MUST call `PUT /auctions/{auction_id}`

### Requirement: Cancel Auction
The system MUST allow sellers to cancel an auction, triggering `PATCH /auctions/{auction_id}/status`.

#### Scenario: Cancel auction
- **GIVEN** the seller clicks cancel on an auction
- **WHEN** they confirm the cancellation modal
- **THEN** the system MUST call `PATCH /auctions/{auction_id}/status`
