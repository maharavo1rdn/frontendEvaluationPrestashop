import { Box } from "lucide-react";
import Sidebar from "./Sidebar";

const FRONTOFFICE_ITEMS = [
  {
    id: "products",
    label: "Products",
    icon: Box,
    children: [{ id: "products-list", label: "Liste", path: "/products" }],
  },
];

const FrontOfficeSidebar = ({ collapsed, onToggle }) => {
  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      navItems={FRONTOFFICE_ITEMS}
      brandLabel="Front office"
    />
  );
};

export default FrontOfficeSidebar;
