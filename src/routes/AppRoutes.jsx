import { Routes, Route } from "react-router-dom";
import ClientsRoutes from "./client/ClientsRoutes";
import ProduitsRoutes from "./produit/ProduitsRoutes";
import CartRoutes from "./cart/CartRoutes";
import ResetTable from "../pages/reset/ResetTable";
import ImportRoutes from "./import/ImportRoutes";
import FrontOfficeLogin from "../pages/auth/FrontOfficeLogin";
import BackOfficeLogin from "../pages/auth/BackOfficeLogin";
import CommandesRoutes from "./commande/CommandesRoutes";
import UserSelector from "../pages/auth/UserSelector";

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FrontOfficeLogin />} />
        <Route path="/backoffice" element={<BackOfficeLogin />} />
        <Route path="/backOffice/reset" element={<ResetTable />} />
        <Route path="/frontOffice/userSelector" element={<UserSelector />} />
      </Routes>
      <ClientsRoutes />
      <ProduitsRoutes />
      <CartRoutes />
      <CommandesRoutes />
      <ImportRoutes />
    </>
  );
}
