import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          HOLES<span>.DEV // PERSONAL TERMINAL</span>
        </div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              HOME
            </NavLink>
          </li>
          <li>
            <NavLink to="/blog" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              BLOG
            </NavLink>
          </li>
          <li>
            <NavLink to="/tools" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              TOOLS
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              STATUS
            </NavLink>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <span>HOLES.DEV // </span>
        <span>Built with React + Cloudflare Workers // </span>
        <span>Pip-Boy theme // </span>
        <span>{new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
