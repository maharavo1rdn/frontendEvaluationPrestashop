import {
  Box,
  LayoutDashboard,
  ListRestartIcon,
  ShoppingCart,
  Upload,
} from "lucide-react";
import Sidebar from "./Sidebar";

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
    label: "Orders",
    icon: ShoppingCart,
    children: [
      { id: "orders-list", label: "Liste", path: "/backOffice/commandes" },
    ],
  },
  {
    id: "stocks",
    label: "Stock",
    icon: Box,
    path: "/backOffice/stocks",
  },
];

const BackOfficeSidebar = ({ collapsed, onToggle }) => {
  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      navItems={BACKOFFICE_ITEMS}
      brandLabel="Back office"
    />
  );
};

export default BackOfficeSidebar;
