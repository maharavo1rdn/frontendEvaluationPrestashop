import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

/* Vérifie si un path est actif (exact pour '/', startsWith pour les autres) */
function isPathActive(itemPath, locationPath) {
  if (itemPath === '/') return locationPath === '/'
  return locationPath === itemPath || locationPath.startsWith(itemPath + '/')
}

export default function SidebarItem({ item, collapsed }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const hasChildren = item.children && item.children.length > 0

  /* Actif si un enfant correspond à l'URL courante */
  const isParentActive = hasChildren
    && item.children.some(c => isPathActive(c.path, location.pathname))

  /* Ouvert par défaut si on est sur une sous-route */
  const [open, setOpen] = useState(isParentActive)

  /* Actif si c'est un item simple */
  const isActive = !hasChildren && item.path
    ? isPathActive(item.path, location.pathname)
    : false

  function handleClick() {
    if (hasChildren) {
      if (!collapsed) setOpen(prev => !prev)
    } else {
      if (typeof item.onClick === 'function') {
        item.onClick({ navigate, location })
        return
      }
      navigate(item.path)
    }
  }

  function handleSubClick(childPath) {
    navigate(childPath)
  }

  return (
    <div className="nav-item">
      {/* Bouton principal */}
      <button
        className={`nav-item__btn ${isActive || isParentActive ? 'active' : ''}`}
        onClick={handleClick}
        data-tooltip={item.label}
        aria-expanded={hasChildren ? open : undefined}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="nav-item__icon" aria-hidden="true">
          <item.icon size={18} strokeWidth={1.8} />
        </span>
        <span className="nav-item__label">{item.label}</span>
        {hasChildren && (
          <ChevronRight
            size={14}
            strokeWidth={2}
            className={`nav-item__chevron ${open && !collapsed ? 'open' : ''}`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Sous-items */}
      {hasChildren && (
        <div className={`nav-item__children ${open && !collapsed ? 'open' : ''}`}>
          {item.children.map(child => {
            const childActive = isPathActive(child.path, location.pathname)
            return (
              <button
                key={child.id}
                className={`nav-subitem__btn ${childActive ? 'active' : ''}`}
                onClick={() => handleSubClick(child.path)}
                aria-label={child.label}
                aria-current={childActive ? 'page' : undefined}
              >
                <span className="nav-subitem__dot" aria-hidden="true" />
                <span className="nav-subitem__label">{child.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
