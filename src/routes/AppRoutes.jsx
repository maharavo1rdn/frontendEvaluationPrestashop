import { Routes, Route } from "react-router-dom";
import ClientsRoutes from "./client/ClientsRoutes";
import ProduitsRoutes from "./produit/ProduitsRoutes";
import ResetTable from "../pages/reset/ResetTable";
import ImportRoutes from "./import/ImportRoutes";
import FrontOfficeLogin from "../pages/auth/FrontOfficeLogin";
import BackOfficeLogin from "../pages/auth/BackOfficeLogin";

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
      <ImportRoutes />
    </>
  );
}
