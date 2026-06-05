# notification-socket

## Purpose
TBD

## Requirements

### Requirement: WebSocket connection to user channel
The system MUST maintain a persistent WebSocket connection to `WS /ws/users/{user_id}` while the app is active and MUST be reactive to authentication state.

#### Scenario: Connection established for authenticated user
- **WHEN** a user is logged in (reactive `userId` exists via Zustand auth store)
- **THEN** a WebSocket connection MUST be opened to `/ws/users/{userId}`

#### Scenario: Connection closed on logout
- **WHEN** the `userId` becomes null in the Zustand auth store
- **THEN** the WebSocket connection MUST be closed automatically

#### Scenario: Auto-reconnect on disconnect
- **WHEN** the WebSocket connection drops
- **THEN** the system MUST attempt reconnection with 3-second intervals indefinitely

### Requirement: Heartbeat keep-alive
The client MUST send periodic heartbeat messages to maintain the connection.

#### Scenario: Heartbeat interval
- **WHEN** the WebSocket connection is open
- **THEN** a `{ type: "heartbeat" }` message MUST be sent every 30 seconds

#### Scenario: Connection timeout
- **WHEN** no server response is received for 60 seconds
- **THEN** the connection MUST be considered dead and reconnection MUST begin

### Requirement: Process incoming notifications
The hook MUST process all `UserNotification` messages and route them to the appropriate display mechanism.

#### Scenario: Single notification processing
- **WHEN** a message of type `outbid`, `auction_won`, or `auction_lost` is received
- **THEN** it MUST be added to the notification queue and displayed according to routing rules (modal vs toast based on current page)

#### Scenario: Pending notifications on connect
- **WHEN** a `pending_notifications` message is received on connection open
- **THEN** each notification in the list MUST be queued and processed sequentially

### Requirement: Notification queue management
The system MUST manage a notification queue to prevent overlapping displays for BOTH modals and toasts.

#### Scenario: Sequential display with delay
- **WHEN** the queue has multiple notifications
- **THEN** they MUST be displayed one at a time without overlapping. Each notification MUST remain visible for 3 seconds before the next one appears.

#### Scenario: Early dismissal bypasses delay
- **WHEN** a user manually closes the currently visible notification before the 3-second delay completes
- **THEN** the next notification in the queue MUST be displayed immediately

### Requirement: Global mount
The notification socket hook MUST be mounted once at the app level via a `NotificationProvider` component in `App.tsx`.

#### Scenario: Single instance
- **WHEN** the app renders
- **THEN** exactly one `NotificationProvider` MUST be mounted, independent of route changes

#### Scenario: Route-aware rendering
- **WHEN** the user navigates between pages
- **THEN** the `NotificationProvider` MUST remain mounted and MUST re-evaluate display mode based on current `location.pathname`
