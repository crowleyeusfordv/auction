## ADDED Requirements

### Requirement: WebSocket Connection and Snapshot
The system SHALL accept WebSocket connections at `/ws/auctions/{auction_id}?user_id={user_id}` and immediately send a `room_state` snapshot to the client.

#### Scenario: Successful connection and snapshot
- **WHEN** client connects to the WebSocket with valid auction_id and user_id
- **THEN** server fetches the `room_state` snapshot from Redis
- **AND** server adds the client to the active broadcast list AFTER fetching the snapshot
- **AND** server pushes the `room_state` snapshot to the client

#### Scenario: Invalid identifiers
- **WHEN** client connects with missing or invalid auction_id or user_id
- **THEN** server rejects the connection with WebSocket close code 4000 (Bad Request)

#### Scenario: Unverified user
- **WHEN** client connects but the user_id does not exist in the database
- **THEN** server rejects the connection with WebSocket close code 4004 (Not Found)

#### Scenario: Auction finished
- **WHEN** client connects to an auction_id that is already finished
- **THEN** server rejects the connection with WebSocket close code 4003 (Forbidden)

#### Scenario: Multiple connections per user
- **WHEN** a client connects with a user_id that is already connected
- **THEN** server accepts the connection and allows up to 5 concurrent sockets for that user_id
- **AND** if the limit is exceeded, server closes the oldest active socket for that user_id

### Requirement: Heartbeat Validation
The system SHALL disconnect any client that does not send a `{"type": "heartbeat"}` message within 60 seconds of their last heartbeat or connection.

#### Scenario: Active client sends heartbeat
- **WHEN** client sends a `{"type": "heartbeat"}` message
- **THEN** server silently updates the client's last heartbeat timestamp without sending a response

#### Scenario: Inactive client disconnection
- **WHEN** 60 seconds elapse without a heartbeat message from a connected client
- **THEN** server closes the WebSocket connection and removes the client from the active connections list

### Requirement: Auction Finish Notification
The system SHALL broadcast the final state and close all connections when an auction ends.

#### Scenario: Active auction finishes
- **WHEN** the auction finishes while clients are connected
- **THEN** server pushes the final `room_state` to all connected clients
- **AND** server closes all WebSocket connections for that auction with code 1000 (Normal Closure)

### Requirement: Message Format and Handling
The system SHALL strictly enforce the JSON message formats for incoming and outgoing communication.

#### Scenario: Server broadcasts room state
- **WHEN** a state change occurs (e.g. new bid, time extension, connection snapshot)
- **THEN** server formats the outgoing message exactly as this example `{
  "type": "room_state",
  "payload": {
    "current_bid": 1500.00,
    "increment_value": 50.00,
    "seconds_remaining": 120,
    "leader": { "user_id": "abc-123", "name": "Maria" },
    "ranking": [
      { "name": "Maria", "amount": 1500.00 },
      { "name": "João", "amount": 1450.00 }
    ],
    "viewer_count": 42,
    "your_position": 5
  }
}`

#### Scenario: Invalid incoming message
- **WHEN** client sends malformed JSON or an unsupported message type
- **THEN** server disconnects the client with WebSocket close code 1003 (Unsupported Data)
