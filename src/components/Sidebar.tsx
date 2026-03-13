import { NavLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { NavItem } from '../types'
import { collapse } from '../store/redux/sidebarSlice'
import { useMediaQuery, MOBILE_BREAKPOINT } from '../hooks/useMediaQuery'

interface SidebarProps {
  navItems: NavItem[];
  isCollapsed: boolean;
}

export function Sidebar({ navItems, isCollapsed }: SidebarProps) {
  const dispatch = useDispatch()
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)

  function handleNavClick() {
    if (isMobile) dispatch(collapse())
  }

  return (
    <aside className={`app-sidebar${isCollapsed ? ' app-sidebar--collapsed' : ''}`}>
      <nav aria-label="Main navigation">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-link${isActive ? ' sidebar-nav-link--active' : ''}`
                }
                end
                title={isCollapsed ? item.label : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                onClick={handleNavClick}
              >
                {item.icon !== undefined ? (
                  <span className="sidebar-nav-link__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                {!isCollapsed && (
                  <span className="sidebar-nav-link__label">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
