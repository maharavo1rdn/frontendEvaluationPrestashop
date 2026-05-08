import { Routes, Route } from "react-router-dom";
import CategoryImport from "../../pages/import/CategoryImport";
import ProductImport from "../../pages/import/ProductImport";
const ImportRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/category/import" element={<CategoryImport />} />
        <Route path="/product/import" element={<ProductImport />} />
      </Routes>
    </>
  );
};
export default ImportRoutes;
