import { Routes, Route } from "react-router-dom";
import StatsVentes from "../../pages/stats/StatVente";
import { EmployeeProtectedRoute } from "../../pages/auth/EmployeeProtectedRoute";
const StatsRoutes = () => {
  return (
    <>
      <Routes>
        <Route
          path="/backOffice/stats/ventes"
          element={
            <EmployeeProtectedRoute>
              <StatsVentes />
            </EmployeeProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};
export default StatsRoutes;
