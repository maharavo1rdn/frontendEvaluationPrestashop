import { ListRestartIcon, ShoppingCart, Upload } from "lucide-react";
import Sidebar from "./Sidebar";

const BACKOFFICE_ITEMS = [
  {
    id: "reset",
    label: "Reset table",
    icon: ListRestartIcon,
    path: "/reset",
  },
  {
    id: "import",
    label: "Import",
    icon: Upload,
    path: "/import",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ShoppingCart,
    children: [{ id: "orders-list", label: "Liste", path: "/commandes" }],
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
