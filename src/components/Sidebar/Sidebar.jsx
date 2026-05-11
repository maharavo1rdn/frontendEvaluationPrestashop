import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import SidebarItem from "./SidebarItem";
import "./sidebar.css";

export default function Sidebar({
  collapsed,
  onToggle,
  navItems = [],
  footerItems = [],
  brandLabel = "NewApp",
}) {
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
          <span className="sidebar__logo-text">{brandLabel}</span>
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
        {navItems.map((item) => (
          <SidebarItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* ── Pied ── */}
      <div className="sidebar__footer">
        {!collapsed && <p className="sidebar__section-title">Compte</p>}
        {footerItems.map((item) => (
          <SidebarItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}
