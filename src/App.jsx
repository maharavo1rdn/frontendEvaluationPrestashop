import { useState } from "react";
import { useLocation } from "react-router-dom";
import BackOfficeSidebar from "./components/Sidebar/BackOfficeSidebar";
import FrontOfficeSidebar from "./components/Sidebar/FrontOfficeSidebar";
import AppRoutes from "./routes/AppRoutes";
import "./App.css";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isLoginRoute = ["/", "/backoffice"].includes(location.pathname);
  const isFrontOfficeRoute = location.pathname.startsWith("/frontOffice");
  const showSidebar = !isLoginRoute;

  const sidebar = isFrontOfficeRoute ? (
    <FrontOfficeSidebar
      collapsed={collapsed}
      onToggle={() => setCollapsed((prev) => !prev)}
    />
  ) : (
    <BackOfficeSidebar
      collapsed={collapsed}
      onToggle={() => setCollapsed((prev) => !prev)}
    />
  );

  return (
    <div className="app-layout">
      {showSidebar && sidebar}
      <main
        className="app-main"
        style={{ marginLeft: showSidebar ? (collapsed ? "64px" : "260px") : "0" }}
        aria-label="Contenu principal"
      >
        <AppRoutes />
      </main>
    </div>
  );
}