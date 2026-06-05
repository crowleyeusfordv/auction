# notification-types

## Purpose
TBD

## Requirements

### Requirement: User notification message types
The system MUST define a discriminated union type `UserNotification` covering all server→client message types from `WS /ws/user/{user_id}`.

#### Scenario: Outbid message parsing
- **WHEN** a WebSocket message with `type: "outbid"` is received
- **THEN** it MUST be parsed into `{ type: "outbid"; payload: { auctionId: string; auctionName: string; imageUrl: string; newAmount: number; yourPosition: number } }`

#### Scenario: Auction won message parsing
- **WHEN** a WebSocket message with `type: "auction_won"` is received
- **THEN** it MUST be parsed into `{ type: "auction_won"; payload: { auctionId: string; auctionName: string; imageUrl: string; finalAmount: number; orderId: string } }`

#### Scenario: Auction lost message parsing
- **WHEN** a WebSocket message with `type: "auction_lost"` is received
- **THEN** it MUST be parsed into `{ type: "auction_lost"; payload: { auctionId: string; auctionName: string; imageUrl: string; winnerName: string; finalAmount: number } }`

### Requirement: Pending notifications envelope
The system MUST handle a `pending_notifications` message type containing an array of `UserNotification` items delivered on connection open.

#### Scenario: Pending notifications on connect
- **WHEN** a WebSocket message with `type: "pending_notifications"` is received
- **THEN** the `payload` field MUST be treated as `UserNotification[]` and each item processed in order

### Requirement: Client heartbeat message type
The system MUST define the client→server `heartbeat` message type used for keep-alive.

#### Scenario: Heartbeat serialization
- **WHEN** the heartbeat interval fires
- **THEN** the client MUST send `{ type: "heartbeat" }` as JSON
