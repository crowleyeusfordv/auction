# Requirements Analysis Document: Real-Time Auction System

## 1. System Overview
The system is a dual-channel real-time auction platform (REST + WebSocket), composed of an Admin Panel (Web/PC) for the shopkeeper to manage products and rules, and a user interface (Mobile H5) for participating in live auction rooms. The core flow demands extremely high data consistency (preventing duplicate bids) and minimal latency.

## 2. Functional Requirements (FR)

### 2.1. Shopkeeper Module (Web Panel)
* **FR01:** The system must allow the shopkeeper to register a product with a name, image, and description.
* **FR02:** The system must allow configuration of auction rules at the time of creation:
    * Starting bid fixed at 0.
    * Bid increment value (e.g., R$ 10.00).
    * Base auction duration.
    * Buy-out price (ceiling price).
    * Activation and rules for automatic time extension (time trigger and additional seconds added, between 10s and 30s).
* **FR03:** The system must allow the shopkeeper to edit the rules of an auction *only* if it has not yet started.
* **FR04:** The system must allow the shopkeeper to cancel an auction at any time due to an "anomaly."
* **FR05:** The system must list all of the shopkeeper's auctions, displaying status (Not started, In progress, Completed, Cancelled), progress, and result.
* **FR06:** The system must automatically generate an order upon the successful closure of an auction and display it to the shopkeeper.

### 2.2. User Module (Mobile H5 – Live Room)
* **FR07:** The system must display a list of products available for auction.
* **FR08:** The system must display auction details in the room: video (mock/fixed player), description, rules, current bid, and participant count.
* **FR09:** The system must allow the user to place a bid. The bid value must *always* be calculated by the backend as `Current Bid + Fixed Increment`.
* **FR10:** The system must instantly notify all clients in the room when a new bid is accepted.
* **FR11:** The system must display and update the bid ranking in real time.
* **FR12:** The system must send critical individual or broadcast notifications ("You have been outbid," "Time extended," "Auction ended").
* **FR13:** The system must immediately end the auction if the buy-out price (ceiling) is reached by a bid.
* **FR14:** The system must present a results screen at the end of the auction and allow the winner to simulate the payment flow.
* **FR15:** The system must allow the user to view the history of auctions in which they participated.

## 3. Non-Functional Requirements (NFR)

* **NFR01 (Architecture):** The frontend will be built with React + TypeScript. The backend must use FastAPI.
* **NFR02 (Communication):** The system must use a hybrid architecture: REST API for standard transactional operations and asynchronous requests (via Ajax/Fetch), and WebSocket for the live room (bids, timer, ranking).
* **NFR03 (Persistence):** MySQL or PostgreSQL for permanent storage (users, orders, products, bid logs).
* **NFR04 (Performance/Cache):** Redis must be used mandatorily to handle high-frequency operations (current bid, countdown, dynamic ranking).
* **NFR05 (WS Stability):** WebSocket connections must implement *Heartbeat* and guarantee automatic reconnection in case of disconnection (client-side).
* **NFR06 (Isolation):** Each auction must operate on an isolated WebSocket channel/room. One room must not impact the traffic or processing of another.
* **NFR07 (Time Precision):** The timer must be calculated via *Server-Time* (backend) and synchronized with the frontend in milliseconds to avoid drift caused by slowness on the user's device.

## 4. User Stories & Scenarios (BDD)

### US01: Placing a Bid in the Auction
**As** a live participant, **I want** to click the bid button **in order to** attempt to win the product.

* **Scenario: Valid Bid (Happy Path)**
  * **Given that** the auction is in progress and active on screen
  * **When** I confirm a bid
  * **Then** the current auction value must be updated by adding the fixed increment
  * **And** my position in the participant ranking must rise to 1st place
  * **And** all users in the room must see the new bid and the updated timer almost instantly

* **Scenario: Bid attempt after auction has ended (Bad Path)**
  * **Given that** the auction timer has run out
  * **When** I try to place a bid
  * **Then** the system must reject my action
  * **And** I must receive a visual warning indicating "Auction already ended"

* **Scenario: Bid attempt after cancellation (Bad Path)**
  * **Given that** the presenter/shopkeeper cancelled the auction due to an anomaly
  * **When** I try to place a bid
  * **Then** the system must reject the action
  * **And** I must be notified that the auction has been suspended

* **Scenario: Exact simultaneous bids (Edge Case)**
  * **Given that** I and another user click the bid button at the exact same instant
  * **When** the system receives both actions simultaneously
  * **Then** only the first bid recognized by the system must be recorded for that specific value
  * **And** the other user must be notified that there was an error placing the bid and should try again

* **Scenario: Click spamming on the button (Edge Case)**
  * **Given that** I click the bid button repeatedly and frantically in a very short interval
  * **When** the system processes my actions
  * **Then** it must accept and process all clicks and increments

---

### US02: Automatic Time Extension
**As** the system, **I want** to extend the auction's closing time when a bid is placed in the last few seconds **in order to** give other participants a fair chance to respond and prevent wins based solely on connection speed (sniper bidding).

* **Scenario: Standard time extension (Happy Path)**
  * **Given that** the auction countdown shows only a few seconds remaining (within the configured extension window)
  * **When** a new valid bid is accepted by the system
  * **Then** the timer must be increased by the extra time defined by the shopkeeper (e.g., +10 seconds)
  * **And** all users in the room must be notified that the time has been extended

* **Scenario: Bid processed at the edge of closing (Edge Case)**
  * **Given that** the visual countdown has reached zero for some users due to internet latency
  * **When** a valid bid is validated by the system in the last millisecond before the official closing
  * **Then** the system must not declare the auction as ended
  * **And** the time must be extended normally, visually reopening the dispute for all users in the room

---

### US03: Buy-out Price (Ceiling)
**As** a shopkeeper, **I want** to set a maximum price (ceiling) in the auction **in order to** sell the product immediately, ensuring my expected profit if a participant decides to cover that maximum value.

* **Scenario: Bid reaches the ceiling value exactly (Happy Path)**
  * **Given that** the auction has a defined ceiling price (e.g., R$ 100)
  * **And** the current bid plus the increment results in exactly R$ 100
  * **When** a user places that bid
  * **Then** the system must accept the bid
  * **And** immediately end the auction, blocking new participations
  * **And** declare this user as the official winner

* **Scenario: Calculated bid would exceed the ceiling value (Edge Case)**
  * **Given that** the auction has a defined ceiling price (e.g., R$ 100)
  * **And** the current bid (e.g., R$ 95) plus the fixed increment (e.g., R$ 10) would result in a value above the ceiling (R$ 105)
  * **When** the user attempts to place that bid
  * **Then** the system must adjust and cap the bid value to close at exactly R$ 100
  * **And** immediately end the auction
  * **And** the user wins the product paying only the ceiling value, never above it

## 5. Global Acceptance Criteria (Definition of Done)

1. **Closed End-to-End Cycle:** It is possible to create, configure, start, participate (bids via WS), view the winner, simulate checkout, and generate an order without interruptions or manual page refreshes.
2. **Strict Mathematical Consistency:** No race condition allows two bids to be recorded with the same monetary value for the same auction.
3. **Connection Resilience:** Client internet drops trigger the *heartbeat* and reconnect, perfectly syncing room state upon return.
4. **Rendering Performance:** The massive flow of events via WebSocket does not cause bottlenecks on the browser's main thread.
5. **Code Quality:** Business logic kept purely in the backend. Well-defined cache patterns (Redis for fast reads, Relational Database for order/history persistence).

---

## 6. Selected Differentiator (To be discussed later if time permits)

> **Note (Backend):** Choose only ONE track to pursue to technical exhaustion, aiming to achieve the extra evaluation criteria.

* **[  ] Backend-Heavy (High Concurrency):** Layered caching, perfect distributed locks, and guaranteed support for 1,000+ simultaneous isolated requests.
* **[  ] Frontend-Heavy (Immersive Experience):** Micro-interactions, animated ranking swaps, haptic/audio feedback for being outbid.
* **[  ] GenAI-Heavy (Traceable AI):** Core coding (State Machine/Locks) guided and reviewed through documented Prompt Engineering.
