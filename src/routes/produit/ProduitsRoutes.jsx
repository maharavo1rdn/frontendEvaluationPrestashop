import { Routes, Route } from "react-router-dom";
import ProduitCreate from "../../pages/produit/ProduitCreate";
import ProduitList from "../../pages/produit/ProduitList";
import ProduitDetail from "../../pages/produit/ProduitDetail";
const ProduitsRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/products" element={<ProduitList />} />
        <Route path="/products/create" element={<ProduitCreate />} />
        <Route path="/products/:id" element={<ProduitDetail />} />
      </Routes>
    </>
  );
};
export default ProduitsRoutes;
