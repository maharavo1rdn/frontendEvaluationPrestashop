import { Routes, Route } from "react-router-dom";
import CartPage from "../../pages/cart/CartPage";

const CartRoutes = () => {
  return (
    <Routes>
      <Route path="/cart" element={<CartPage />} />
    </Routes>
  );
};

export default CartRoutes;
