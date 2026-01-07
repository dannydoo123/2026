import { useContext } from 'react'
import { ThemeContext } from '../App'
import './Settings.css'

function Settings() {
  const { theme, currentTheme, setCurrentTheme, themes, currentFont, setCurrentFont } = useContext(ThemeContext)

  const themeNames = {
    light: '밝은 테마',
    dark: '어두운 테마',
    ocean: '바다 테마',
    sunset: '노을 테마',
    forest: '숲 테마',
    animalcrossing: '동물의 숲'
  }

  const fonts = [
    { name: 'Nanum Pen Script', label: '나눔손글씨 펜' },
    { name: 'Nanum Brush Script', label: '나눔손글씨 붓' },
    { name: 'Nanum Gothic', label: '나눔고딕' },
    { name: 'Nanum Myeongjo', label: '나눔명조' },
    { name: 'Noto Sans KR', label: '본고딕' },
    { name: 'Noto Serif KR', label: '본명조' },
    { name: 'Black Han Sans', label: '검은고딕' },
    { name: 'Cute Font', label: '귀여운 폰트' },
    { name: 'Sunflower', label: '해바라기' },
    { name: 'Jua', label: '주아' },
    { name: 'Gamja Flower', label: '감자꽃' },
    { name: 'Stylish', label: '스타일리쉬' },
    { name: 'Dokdo', label: '독도' },
    { name: 'East Sea Dokdo', label: '동해독도' },
    { name: 'Poor Story', label: '가난한 이야기' },
    { name: 'Song Myung', label: '송명' },
    { name: 'Gothic A1', label: '고딕 A1' },
    { name: 'Do Hyeon', label: '도현체' }
  ]

  return (
    <div className="settings-page">
      <h1 style={{ color: theme.text }}>설정</h1>

      <div className="settings-container" style={{ backgroundColor: theme.card }}>
        <section className="settings-section">
          <h2 style={{ color: theme.text }}>테마 변경</h2>
          <div className="theme-options">
            {Object.keys(themes).map(themeName => (
              <button
                key={themeName}
                className={`theme-option-button ${currentTheme === themeName ? 'selected' : ''}`}
                onClick={() => setCurrentTheme(themeName)}
                style={{
                  backgroundColor: currentTheme === themeName ? theme.accent : theme.background,
                  color: currentTheme === themeName ? '#fff' : theme.text,
                  border: `2px solid ${theme.accent}`
                }}
              >
                {themeNames[themeName]}
              </button>
            ))}
          </div>
        </section>

        <div className="settings-divider" style={{ backgroundColor: theme.text }}></div>

        <section className="settings-section">
          <h2 style={{ color: theme.text }}>폰트 변경</h2>
          <div className="font-selector">
            <select
              value={currentFont}
              onChange={(e) => setCurrentFont(e.target.value)}
              className="font-dropdown"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                border: `2px solid ${theme.accent}`
              }}
            >
              {fonts.map(font => (
                <option
                  key={font.name}
                  value={font.name}
                  style={{ fontFamily: font.name }}
                >
                  {font.label}
                </option>
              ))}
            </select>
            <div
              className="font-preview"
              style={{
                color: theme.text,
                fontFamily: currentFont,
                border: `2px solid ${theme.accent}`
              }}
            >
              2026년 목표를 향해 달려가요! 🎯
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
