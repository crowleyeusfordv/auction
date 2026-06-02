## Why
Sellers need a dedicated interface to manage their auctions and view completed orders (auctions completed). This allows them to create new listings, monitor active ones, and track sales without backend complexities (frontend focus).

## What Changes
- Add Seller Dashboard layout with sidebar navigation (My Auctions, Orders).
- Create "My Auctions" page to list auctions (name of the product, img of the product ,  edit button, cancel btn, starting bid, fixed increment, highest bid, current bid, times people gave a bid, status (not started, on going, cancelled, completed)).
- Implement "Create Auction" modal with detailed settings (- Starting bid
- fixed increment
- highest bid (buy-out)
- current bid
- name of the product
- description
- image or video
- base duration
- checkbox extended duration
  - if checked gonna show up two new field:
     - Trigger ( how many seconds before the auction finish)
     - Seconds added ( how many seconds gonna be added)
- when this gonna start ( select -> right now or 1am, 2am...) ).
- Create "Orders" page displaying completed sales (Name of the product, img of product, name of the winner, date when it was sold, id of the auction complete).

## Capabilities

### New Capabilities
- `seller-dashboard`: Sidebar layout for seller navigation.
- `seller-auctions`: Auction listing page and creation modal with advanced settings.
- `seller-orders`: Orders page displaying sales history from completed auctions.

### Modified Capabilities

## Impact
- New routes for seller pages (`/seller`).
- New UI components for forms, modals, and lists.
-  GET /auctions?seller_id={seller_id} -> list of auctions returns per seller.
   PUT /auctions/{auction_id} -> update auction settings.
   PATCH /auctions/{auction_id}/status -> cancel auction. 
   POST /auctions -> Create a new auction 
.
