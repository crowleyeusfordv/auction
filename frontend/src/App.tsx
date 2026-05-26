import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import Home from "./pages/public/Home/Home";
import SellerLayout from "./layouts/SellerLayout";
import MyAuctionsPage from "./pages/seller/MyAuctionsPage";
import OrdersPage from "./pages/seller/OrdersPage";

function App() {
  return (
    <>
      <Toaster richColors />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<Navigate to="/seller/auctions" replace />} />
          <Route path="auctions" element={<MyAuctionsPage />} />
          <Route path="orders" element={<OrdersPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
