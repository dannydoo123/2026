import { useContext, useState } from 'react'
import { ThemeContext } from '../App'
import './ThemeSelector.css'

function ThemeSelector() {
  const { currentTheme, setCurrentTheme, themes, theme } = useContext(ThemeContext)
  const [isOpen, setIsOpen] = useState(false)

  const themeNames = {
    light: '밝은 테마',
    dark: '어두운 테마',
    ocean: '바다 테마',
    sunset: '노을 테마',
    forest: '숲 테마'
  }

  return (
    <div className="theme-selector">
      <button
        className="theme-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: theme.navbar,
          color: theme.text,
          border: `2px solid ${theme.accent}`
        }}
      >
        테마 변경
      </button>
      {isOpen && (
        <div className="theme-dropdown" style={{
          backgroundColor: theme.card,
          border: `2px solid ${theme.accent}`
        }}>
          {Object.keys(themes).map(themeName => (
            <button
              key={themeName}
              className={`theme-option ${currentTheme === themeName ? 'selected' : ''}`}
              onClick={() => {
                setCurrentTheme(themeName)
                setIsOpen(false)
              }}
              style={{
                backgroundColor: currentTheme === themeName ? theme.accent : 'transparent',
                color: currentTheme === themeName ? '#fff' : theme.text
              }}
            >
              {themeNames[themeName]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThemeSelector
