import { Routes, Route } from "react-router-dom";
import ImportAll from "../../pages/import/ImportAll";
import { EmployeeProtectedRoute } from "../../pages/auth/EmployeeProtectedRoute";
const ImportRoutes = () => {
  return (
    <>
      <Routes>
        <Route
          path="/backOffice/import"
          element={
            <EmployeeProtectedRoute>
              <ImportAll />
            </EmployeeProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};
export default ImportRoutes;
