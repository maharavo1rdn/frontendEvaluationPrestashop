import {
  Box,
  ChartArea,
  LayoutDashboard,
  ListRestartIcon,
  LogOut,
  ShoppingCart,
  Upload,
} from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../pages/auth/AuthContext";
import { useNavigate } from "react-router-dom";

const BACKOFFICE_ITEMS = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    path: "/backOffice/dashboard",
  },
  {
    id: "reset",
    label: "Reset table",
    icon: ListRestartIcon,
    path: "/backOffice/reset",
  },
  {
    id: "import",
    label: "Import",
    icon: Upload,
    path: "/backOffice/import",
  },
  {
    id: "orders",
    label: "Commandes",
    icon: ShoppingCart,
    path: "/backOffice/commandes",
    // children: [
    //   { id: "orders-list", label: "Liste", path: "/backOffice/commandes" },
    // ],
  },
  {
    id: "stocks",
    label: "Stock",
    icon: Box,
    path: "/backOffice/stocks",
  },
  {
    id: "stats-vente",
    label: "Stats des ventes",
    icon: ChartArea,
    path: "/backOffice/stats/ventes",
  },
];

const BackOfficeSidebar = ({ collapsed, onToggle }) => {
  const { logoutAll } = useAuth();
  const navigate = useNavigate();

  const footerItems = [
    {
      id: "logout",
      label: "Deconnexion",
      icon: LogOut,
      path: "/",
      onClick: () => {
        logoutAll();
        navigate("/");
      },
    },
  ];

  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      navItems={BACKOFFICE_ITEMS}
      footerItems={footerItems}
      brandLabel="Back office"
    />
  );
};

export default BackOfficeSidebar;
