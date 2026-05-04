import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <NavLink to="/" className="nav-logo">
          <div className="logo-icon">⚛</div>
          <span>QCNN<span className="gradient-text"> Detect</span></span>
        </NavLink>

        <ul className="nav-links">
          <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
          <li><NavLink to="/detect"  className={({ isActive }) => isActive ? 'active' : ''}>Detect</NavLink></li>
          <li><NavLink to="/about"   className={({ isActive }) => isActive ? 'active' : ''}>About</NavLink></li>
          <li>
            <NavLink to="/detect" className="btn-primary" style={{ padding: '8px 22px', fontSize: '0.875rem' }}>
              Try Now →
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  )
}
