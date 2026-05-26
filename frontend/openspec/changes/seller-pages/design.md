## Context
Sellers need a UI to manage their auctions and track completed orders. The project is a implementation using React 19, React Router 7, Mantine 9 (for UI components), Tailwind CSS 4 (for layout/styling), and React Query. 

## Goals / Non-Goals

**Goals:**
- Implement Seller Dashboard layout.
- Implement "My Auctions" and "Orders" menus.
- Implement forms for creating and editing auctions (using `react-hook-form` + `zod`).
- Real backend API integration
   GET /auctions?seller_id={seller_id} -> list of auctions returns per seller.
   PUT /auctions/{auction_id} -> update auction settings.
   PATCH /auctions/{auction_id}/status -> cancel auction. 
   POST /auctions -> Create a new auction 


## Decisions

- **State Management / Data Fetching:** Use `@tanstack/react-query`
- **UI Framework:** Use `@mantine/core` for Modals, Tables, and Inputs. Use Tailwind CSS for container layouts and utility styling.
- **Form Handling:** Use `react-hook-form` with `zod` resolver for the "Create/Edit Auction" modal to enforce validation rules (starting bid, duration, triggers) efficiently.
- **Routing:** Use `react-router` for nested routes (`/seller/auctions`, `/seller/orders`) sharing a common Sidebar layout wrapper.

