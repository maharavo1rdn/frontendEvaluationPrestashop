import { Routes, Route } from "react-router-dom";
import CartPage from "../../pages/cart/CartPage";
import { CustomerProtectedRoute } from "../../pages/auth/CustomerProtectedRoute";

const CartRoutes = () => {
  return (
    <Routes>
      <Route
        path="/frontOffice/cart"
        element={
          <CustomerProtectedRoute>
            <CartPage />
          </CustomerProtectedRoute>
        }
      />
    </Routes>
  );
};

export default CartRoutes;
