## MODIFIED Requirements

### Requirement: Message Format and Handling
The system SHALL strictly enforce the JSON message formats for incoming and outgoing communication, specifically supporting `heartbeat` and `place_bid` incoming types.

#### Scenario: Server broadcasts room state
- **WHEN** a general state change occurs (e.g. time extension, connection snapshot)
- **THEN** server formats the outgoing message exactly as this example `{
  "type": "room_state",
  "payload": {
    "current_bid": 1500.00,
    "increment_value": 50.00,
    "seconds_remaining": 120,
    "ranking": [
      { "name": "Maria", "amount": 1500.00 },
      { "name": "João", "amount": 1450.00 }
    ],
    "viewer_count": 42,
    "your_position": 5
  }
}`

#### Scenario: Server broadcasts new bid
- **WHEN** a successful bid is placed via the `live-room-bidding` pipeline
- **THEN** server formats the outgoing broadcast message exactly as this example: `{
  "type": "new_bid",
  "payload": {
    "new_amount": 1550.00,
    "ranking": [
      { "name": "Carlos", "amount": 1550.00 },
      { "name": "Maria", "amount": 1500.00 }
    ],
    "your_position": 4
  }
}`

#### Scenario: Client sends valid supported message
- **WHEN** client sends a valid JSON message with `"type": "heartbeat"` OR `"type": "place_bid"`
- **THEN** server routes the message to the appropriate handler without disconnecting

#### Scenario: Invalid incoming message
- **WHEN** client sends malformed JSON or an unsupported message type (anything other than `heartbeat` or `place_bid`)
- **THEN** server disconnects the client with WebSocket close code 1003 (Unsupported Data)
