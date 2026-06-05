## ADDED Requirements

### Requirement: Bid Placement Pipeline
The system SHALL accept `{"type": "place_bid"}` WebSocket messages, calculate the new bid amount, securely perform atomic increment via Redis, and broadcast the outcome.

#### Scenario: Active auction valid bid
- **WHEN** client sends a `{"type": "place_bid"}` message
- **AND** the auction is currently active
- **THEN** server calculates `new_amount` as `current_bid + increment_value`
- **AND** server performs an atomic Redis update to apply the new bid
- **AND** server broadcasts a `{"type": "new_bid", "payload": {...}}` message to all connected clients

#### Scenario: Auction inactive
- **WHEN** client sends a `{"type": "place_bid"}` message
- **AND** the auction is NOT active (e.g., finished or not started)
- **THEN** server rejects the bid and does not update Redis or broadcast a new bid message

#### Scenario: Current leader places another bid
- **WHEN** client sends a `{"type": "place_bid"}` message
- **AND** the client is already the current leader (rank 1)
- **THEN** server accepts the bid, increments the amount, and broadcasts normally

### Requirement: Bid Broadcast Formatting
The system SHALL format the `new_bid` broadcast accurately for each connected client, calculating their unique `your_position` if they have participated at least once.

#### Scenario: Participant receives bid update
- **WHEN** server broadcasts a `new_bid` message
- **AND** the receiving client has placed at least one bid in this auction
- **THEN** the broadcast payload SHALL include the `your_position` field with their ranking

#### Scenario: Observer receives bid update
- **WHEN** server broadcasts a `new_bid` message
- **AND** the receiving client has NEVER placed a bid in this auction
- **THEN** the broadcast payload SHALL NOT include the `your_position` field (sends only `ranking`)

### Requirement: Bid Rate Limiting
The system SHALL limit the rate of bids per user to prevent spam and abuse.

#### Scenario: User bids within rate limit
- **WHEN** client sends a `{"type": "place_bid"}` message
- **AND** the user has not placed a bid in the last 1 second
- **THEN** server processes the bid normally

#### Scenario: User exceeds rate limit
- **WHEN** client sends a `{"type": "place_bid"}` message
- **AND** the user has already placed a bid within the last 1 second
- **THEN** server rejects the bid and does not update Redis and send a "bid rate limited" message to the user

### Requirement: Asynchronous Bid Persistence
The system SHALL asynchronously persist successfully placed bids into the PostgreSQL database, ensuring resilience against database failures.

#### Scenario: Bid successfully applied in Redis
- **WHEN** a bid is successfully atomically processed in Redis
- **THEN** server SHALL dispatch an asynchronous background task to insert a `Bid` record into the Postgres `bids` table
- **AND** the database insertion MUST NOT block the WebSocket fan-out broadcast

#### Scenario: Database insertion fails
- **WHEN** the asynchronous database insertion fails (e.g. database offline)
- **THEN** the system SHALL log the error
- **AND** the system SHALL push the bid data into a Redis List (e.g., `failed_bids_queue`) for reliable retry
- **AND** the failure SHALL NOT revert the successful bid in Redis
