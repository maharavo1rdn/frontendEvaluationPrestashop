import { Routes, Route } from "react-router-dom";
import ProduitCreate from "../../pages/produit/ProduitCreate";
import ProduitList from "../../pages/produit/ProduitList";
import ProduitDetail from "../../pages/produit/ProduitDetail";
import { CustomerProtectedRoute } from "../../pages/auth/CustomerProtectedRoute";
const ProduitsRoutes = () => {
  return (
    <>
      <Routes>
        <Route
          path="/frontOffice/products"
          element={
            <CustomerProtectedRoute>
              <ProduitList />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/frontOffice/products/create"
          element={
            <CustomerProtectedRoute>
              <ProduitCreate />
            </CustomerProtectedRoute>
          }
        />
        <Route
          path="/frontOffice/products/:id"
          element={
            <CustomerProtectedRoute>
              <ProduitDetail />
            </CustomerProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};
export default ProduitsRoutes;
