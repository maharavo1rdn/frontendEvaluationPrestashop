import { Routes, Route } from "react-router-dom";
import ClientsRoutes from "./client/ClientsRoutes";
import ProduitsRoutes from "./produit/ProduitsRoutes";
import CartRoutes from "./cart/CartRoutes";
import ResetTable from "../pages/reset/ResetTable";
import ImportRoutes from "./import/ImportRoutes";
import FrontOfficeLogin from "../pages/auth/FrontOfficeLogin";
import BackOfficeLogin from "../pages/auth/BackOfficeLogin";
import CommandesRoutes from "./commande/CommandesRoutes";

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<FrontOfficeLogin />} />
        <Route path="/backoffice" element={<BackOfficeLogin />} />
        <Route path="/reset" element={<ResetTable />} />
      </Routes>
      <ClientsRoutes />
      <ProduitsRoutes />
      <CartRoutes />
      <CommandesRoutes />
      <ImportRoutes />
    </>
  );
}
