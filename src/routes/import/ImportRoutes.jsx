import { Routes, Route } from "react-router-dom";
import ImportAll from "../../pages/import/ImportAll";
const ImportRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/import" element={<ImportAll />} />
      </Routes>
    </>
  );
};
export default ImportRoutes;
