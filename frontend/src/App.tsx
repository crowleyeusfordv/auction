import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import Home from "./pages/public/Home/Home";
import SellerLayout from "./layouts/SellerLayout";
import MyAuctionsPage from "./pages/seller/MyAuctionsPage";
import OrdersPage from "./pages/seller/OrdersPage";
import LiveRoomPage from "./pages/LiveRoomPage";
import Auctions from "./pages/public/Auctions/Auctions";
import { ROUTES } from "./shared/constants/routes";
import { NotificationProvider } from "@/shared/components/Notifications/NotificationProvider";


function App() {
  return (
    <>
      <Toaster richColors />
      <NotificationProvider />
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path={ROUTES.AUCTIONS.ROOT} element={<Auctions />} />
        <Route path={ROUTES.AUCTIONS.LIVE_ROOM} element={<LiveRoomPage />} />
        <Route path={ROUTES.SELLER.ROOT} element={<SellerLayout />}>
          <Route index element={<Navigate to={ROUTES.SELLER.AUCTIONS} replace />} />
          <Route path={ROUTES.SELLER.AUCTIONS} element={<MyAuctionsPage />} />
          <Route path={ROUTES.SELLER.ORDERS} element={<OrdersPage />} />
        </Route>
        <Route path={ROUTES.BUYER.ROOT}>
          <Route index element={<Navigate to={ROUTES.BUYER.BIDS} replace />} />
          <Route path={ROUTES.BUYER.BIDS} element={<p>My Bids Page</p>} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
