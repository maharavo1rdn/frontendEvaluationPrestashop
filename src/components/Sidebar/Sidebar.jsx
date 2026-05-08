import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
  User,
  Box,
  ListRestartIcon,
  Upload,
} from "lucide-react";
import SidebarItem from "./SidebarItem";
import "./sidebar.css";

export const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    id: "reset",
    label: "Réinitialisation",
    icon: ListRestartIcon,
    path: "/reset",
  },
  {
    id: "csvimport",
    label: "Import CSV",
    icon: Upload,
    children: [
      { id: "category", label: "Catégorie", path: "/category/import" },
      { id: "product", label: "Produit", path: "/product/import" },
    ],
  },
  {
    id: "commandes",
    label: "Commandes",
    icon: ShoppingCart,
    children: [
      { id: "commandes-encours", label: "En cours", path: "/commandes" },
      {
        id: "commandes-historique",
        label: "Historique",
        path: "/commandes/historique",
      },
    ],
  },
  {
    id: "products",
    label: "Produits",
    icon: Box,
    children: [
      { id: "produit-creation", label: "Création", path: "/products/create" },
      { id: "produit-liste", label: "Liste", path: "/products" },
    ],
  },
  {
    id: "client",
    label: "Clients",
    icon: User,
    children: [
      { id: "client-creation", label: "Création", path: "/client/create" },
      { id: "client-liste", label: "Liste", path: "/client" },
    ],
  },
];

export const FOOTER_ITEMS = [
  {
    id: "parametres",
    label: "Paramètres",
    icon: Settings,
    path: "/parametres",
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`sidebar ${collapsed ? "collapsed" : ""}`}
      aria-label="Navigation principale"
    >
      {/* ── En-tête ── */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon" aria-hidden="true">
            <Layers size={18} color="#ffffff" strokeWidth={2} />
          </div>
          <span className="sidebar__logo-text">MyApp</span>
        </div>
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? "Ouvrir le menu" : "Fermer le menu"}
        >
          {collapsed ? (
            <ChevronRight size={15} strokeWidth={2} />
          ) : (
            <ChevronLeft size={15} strokeWidth={2} />
          )}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar__nav" aria-label="Menu principal">
        {!collapsed && <p className="sidebar__section-title">Menu</p>}
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── Pied ── */}
      <div className="sidebar__footer">
        {!collapsed && <p className="sidebar__section-title">Compte</p>}
        {FOOTER_ITEMS.map((item) => (
          <SidebarItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}
