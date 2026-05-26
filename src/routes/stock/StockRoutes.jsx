import { Routes, Route } from "react-router-dom";
import StockManagement from "../../pages/stock/StockManagement";
import { EmployeeProtectedRoute } from "../../pages/auth/EmployeeProtectedRoute";
import StockEvolution from "../../pages/stock/StockEvolution";
import RemoveStock from "../../pages/stock/RemoveStock";
import { CustomerProtectedRoute } from "../../pages/auth/CustomerProtectedRoute";
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
        <Route
          path="/frontOffice/removeStock"
          element={
            <CustomerProtectedRoute>
              <RemoveStock></RemoveStock>
            </CustomerProtectedRoute>
          }
        ></Route>
      </Routes>
    </>
  );
};
export default StockRoutes;
