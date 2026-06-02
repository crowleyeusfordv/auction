## 1. Setup & API Layer

- [x] 1.1 Configure React Router nested routes for `/seller`, `/seller/auctions`, and `/seller/orders`
- [x] 1.2 Implement API service module for auctions (GET list, POST create, PUT update, PATCH cancel)
- [x] 1.3 Create React Query hooks (`useAuctionsList`, `useCreateAuction`, `useUpdateAuction`, `useCancelAuction`)

## 2. Layout & UI Structure

- [x] 2.1 Create `SellerLayout` component using Mantine AppShell
- [x] 2.2 Add navigation links ("My Auctions", "Orders") to the sidebar

## 3. My Auctions Page

- [x] 3.1 Create `AuctionsList` component to render fetched auctions (image, bids, status, edit/cancel buttons)
- [x] 3.2 Implement `CreateAuctionModal` using `react-hook-form` + `zod` for the new auction fields
- [x] 3.3 Implement `EditAuctionModal` to pre-fill and update auction settings
- [x] 3.4 Implement `CancelAuctionModal` for cancellation confirmation
- [x] 3.5 Assemble `MyAuctionsPage` wrapping the list, the 'Create btn', and the modals

## 4. Orders Page

- [x] 4.1 Create `OrdersList` component rendering completed sales data (winner, price, date)
- [x] 4.2 Assemble `OrdersPage` wrapping the list
