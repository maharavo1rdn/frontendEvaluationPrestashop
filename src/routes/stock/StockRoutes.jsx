import { Routes, Route } from "react-router-dom";
import StockManagement from "../../pages/stock/StockManagement";
import { EmployeeProtectedRoute } from "../../pages/auth/EmployeeProtectedRoute";
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
      </Routes>
    </>
  );
};
export default StockRoutes;
