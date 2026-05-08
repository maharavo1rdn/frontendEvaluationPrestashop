import { Routes, Route } from "react-router-dom";
import CategoryImport from "../../pages/import/CategoryImport";
const ImportRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/category/import" element={<CategoryImport />} />
      </Routes>
    </>
  );
};
export default ImportRoutes;
