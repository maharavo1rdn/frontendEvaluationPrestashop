import { Routes, Route } from "react-router-dom";
import ProduitCreate from "../../pages/produit/ProduitCreate";
import ProduitList from "../../pages/produit/ProduitList";
import ProduitDetail from "../../pages/produit/ProduitDetail";
const ProduitsRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/frontOffice/products" element={<ProduitList />} />
        <Route path="/frontOffice/products/create" element={<ProduitCreate />} />
        <Route path="/frontOffice/products/:id" element={<ProduitDetail />} />
      </Routes>
    </>
  );
};
export default ProduitsRoutes;
