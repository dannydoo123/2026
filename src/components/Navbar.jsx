import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

function Navbar() {
  const { theme } = useContext(ThemeContext)
  const location = useLocation()
  const { user, signOut } = useAuth()

  const navItems = [
    { path: '/', label: '홈' },
    { path: '/money', label: '돈' },
    { path: '/exercise', label: '운동' },
    { path: '/dopamine', label: '도파민' },
    { path: '/hobby', label: '취미' },
    { path: '/routine', label: '일과' },
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
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: `2px solid ${theme.accent}`
                  }}
                />
              )}
              <span>{user.user_metadata?.name || user.email}</span>
            </div>
            <button
              onClick={signOut}
              style={{
                padding: '6px 16px',
                backgroundColor: theme.accent,
                color: theme.text,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
