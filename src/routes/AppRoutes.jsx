import { Routes, Route } from "react-router-dom";
import ClientsRoutes from "./client/ClientsRoutes";
import Dashboard from "../components/Dashboard";
import ProduitsRoutes from "./produit/ProduitsRoutes";
import ResetTable from "../pages/reset/ResetTable";
import ImportRoutes from "./import/ImportRoutes";

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reset" element={<ResetTable />} />
      </Routes>
      <ClientsRoutes />
      <ProduitsRoutes />
      <ImportRoutes />
    </>
  );
}
