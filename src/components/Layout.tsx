// Challenge 26 — Capstone update:
// Added Dashboard nav item pointing to /dashboard (Feature 2).
// Mobile: sidebar overlay, backdrop closes on tap.

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Footer } from './Footer'
import { useAppSelector, useAppDispatch } from '../store/redux/hooks'
import { toggle, collapse } from '../store/redux/sidebarSlice'
import { useMediaQuery, MOBILE_BREAKPOINT } from '../hooks/useMediaQuery'
import type { NavItem } from '../types'
import '../App.css'

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '\u229E' },
  { label: 'Projects',  path: '/projects',  icon: '\u25A6' },
]

export function Layout() {
  const isCollapsed = useAppSelector((s) => s.sidebar.isCollapsed)
  const dispatch = useAppDispatch()
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT)

  useEffect(() => {
    if (isMobile) dispatch(collapse())
  }, [isMobile, dispatch])

  return (
    <div className={`app-grid${isCollapsed ? ' app-grid--sidebar-collapsed' : ''}${isMobile ? ' app-grid--mobile' : ''}`}>
      <Header
        title="Scrum Project Manager"
        subtitle="Manage your work"
        onToggleSidebar={() => dispatch(toggle())}
      />
      {isMobile && !isCollapsed && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => dispatch(collapse())}
        />
      )}
      <Sidebar navItems={navItems} isCollapsed={isCollapsed} />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
