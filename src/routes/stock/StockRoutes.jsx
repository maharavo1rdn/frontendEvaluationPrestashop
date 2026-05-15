import { Routes, Route } from "react-router-dom";
import StockManagement from "../../pages/stock/StockManagement";
import { EmployeeProtectedRoute } from "../../pages/auth/EmployeeProtectedRoute";
import StockEvolution from "../../pages/stock/StockEvolution";
const StockRoutes = () => {
  return (
    <>
      <Routes>
        <Route
          path="/backOffice/stocks"
          element={
            <EmployeeProtectedRoute>
              <StockManagement />
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/backOffice/stock/evolution/:productId"
          element={
            <EmployeeProtectedRoute>
              <StockEvolution />
            </EmployeeProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};
export default StockRoutes;
