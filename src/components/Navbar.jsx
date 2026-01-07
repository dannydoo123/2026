import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeContext } from '../App'
import './Navbar.css'

function Navbar() {
  const { theme } = useContext(ThemeContext)
  const location = useLocation()

  const navItems = [
    { path: '/', label: '홈' },
    { path: '/money', label: '돈' },
    { path: '/exercise', label: '운동' },
    { path: '/dopamine', label: '도파민' },
    { path: '/settings', label: '설정' }
  ]

  return (
    <nav className="navbar" style={{
      backgroundColor: theme.navbar,
      color: theme.text
    }}>
      <div className="navbar-container">
        <Link to="/" className="navbar-title" style={{ color: theme.text, textDecoration: 'none' }}>
          2026 목표
        </Link>
        <div className="navbar-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              style={{
                color: theme.text,
                borderBottom: location.pathname === item.path ? `3px solid ${theme.accent}` : 'none'
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
