import { LayoutDashboard, ListRestartIcon, ShoppingCart, Upload } from "lucide-react";
import Sidebar from "./Sidebar";

const BACKOFFICE_ITEMS = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    path: "/bakcOffice/dashboard",
  },
  {
    id: "reset",
    label: "Reset table",
    icon: ListRestartIcon,
    path: "/bakcOffice/reset",
  },
  {
    id: "import",
    label: "Import",
    icon: Upload,
    path: "/bakcOffice/import",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingCart,
    children: [{ id: "orders-list", label: "Liste", path: "/backOffice/commandes" }],
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
