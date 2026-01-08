import { useContext, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '../hooks/useIsMobile'
import './Navbar.css'

function Navbar() {
  const { theme } = useContext(ThemeContext)
  const location = useLocation()
  const { user, signOut } = useAuth()
  const isMobile = useIsMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: '홈' },
    { path: '/money', label: '돈' },
    { path: '/exercise', label: '운동' },
    { path: '/dopamine', label: '도파민' },
    { path: '/hobby', label: '취미' },
    { path: '/routine', label: '일과' },
    { path: '/settings', label: '설정' }
  ]

  const handleNavClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }

  return (
    <nav className="navbar" style={{
      backgroundColor: theme.navbar,
      color: theme.text
    }}>
      <div className="navbar-container">
        <Link to="/" className="navbar-title" style={{ color: theme.text, textDecoration: 'none' }}>
          2026 목표
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
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
        )}

        {/* User Info & Logout (Desktop) */}
        {user && !isMobile && (
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

        {/* Hamburger Menu Button (Mobile) */}
        {isMobile && (
          <button
            className="hamburger-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.text,
              fontSize: '1.8rem',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-menu" style={{
          backgroundColor: theme.navbar,
          borderTop: `1px solid ${theme.accent}`
        }}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
              style={{
                color: theme.text,
                backgroundColor: location.pathname === item.path ? theme.accent : 'transparent'
              }}
            >
              {item.label}
            </Link>
          ))}

          {user && (
            <>
              <div className="mobile-menu-divider" style={{ borderColor: theme.accent }}></div>
              <div className="mobile-user-info" style={{ color: theme.text }}>
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
                onClick={() => {
                  signOut()
                  setMobileMenuOpen(false)
                }}
                className="mobile-logout-btn"
                style={{
                  backgroundColor: theme.accent,
                  color: '#fff'
                }}
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
