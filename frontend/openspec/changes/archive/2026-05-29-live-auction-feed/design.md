## Context
A live auction feed page similar to TikTok needs to be developed to showcase current active auctions in a highly engaging vertical scroll format. The UI needs to be purely structural without backend integrations for now.

## Goals / Non-Goals

**Goals:**
- Implement the responsive UI layout and components based on the provided sketch.
- Develop pure presentation components: Hamburger menu (shared), Viewer(live-room) count indicator, Media display (video/static) (live-room), Interactive card (Product Image, Highest bid/Base price, Bid b, Ranking and Other Auctions buttons)(live-room), and a Chatbox for messages(live-room).
- Try to use as much as possible the mantine library we already have in our project

**Non-Goals:**
- Any state management for data flow.
- API requests, backend integration, websockets for live chat or bids.
- Authentication or user sessions.

## Decisions
- Approach: Build pure isolated React components for each part of the feed. Assemble them into a main `LiveAuctionFeed` container.
- Layout: Use a full viewport container with CSS vertical layout to position elements absolutely over a main media layer (video/image background), mimicking short-form video layouts.
- Starting from the smallest ones until go to the final LiveAuctionPage
- Only create components really necessary. If we have the mantine version, then use mantine. Example: Button with the name Ranking. Just use the mantine button

## Risks / Trade-offs
- Scroll UX across devices: Building an endless vertical scroll requires careful attention to touch and scroll events if CSS scroll snapping isn't enough. We will rely on simple vertical overflow for now, and can enhance it later.
