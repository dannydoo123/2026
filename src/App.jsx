import { useState, useEffect, createContext } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Money from './pages/Money'
import Exercise from './pages/Exercise'
import Dopamine from './pages/Dopamine'
import Hobby from './pages/Hobby'
import Routine from './pages/Routine'
import Settings from './pages/Settings'
import Login from './pages/Login'
import AnimatedSprite from './components/AnimatedSprite'
import './App.css'

export const ThemeContext = createContext()

const themes = {
  light: {
    background: '#f5f5dc',
    text: '#333333',
    navbar: '#e8d7b8',
    card: '#ffffff',
    accent: '#8b7355'
  },
  dark: {
    background: '#2c2c2c',
    text: '#f0f0f0',
    navbar: '#1a1a1a',
    card: '#3a3a3a',
    accent: '#6b8e23'
  },
  ocean: {
    background: '#e6f3f5',
    text: '#1a4d5c',
    navbar: '#b8d8dc',
    card: '#ffffff',
    accent: '#4a90a4'
  },
  sunset: {
    background: '#fff4e6',
    text: '#5c3a1a',
    navbar: '#ffd9a6',
    card: '#fffaf0',
    accent: '#ff8c42'
  },
  forest: {
    background: '#e8f5e9',
    text: '#2d5016',
    navbar: '#c8e6c9',
    card: '#f1f8f4',
    accent: '#558b2f'
  },
  animalcrossing: {
    background: 'url(/background1.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    text: '#4a3728',
    navbar: 'rgba(245, 222, 179, 0.9)',
    card: 'rgba(255, 250, 240, 0.85)',
    accent: '#8fbc8f'
  }
}

function App() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  const [currentFont, setCurrentFont] = useState(() => {
    return localStorage.getItem('font') || 'Nanum Pen Script'
  })

  useEffect(() => {
    localStorage.setItem('theme', currentTheme)
  }, [currentTheme])

  useEffect(() => {
    localStorage.setItem('font', currentFont)
  }, [currentFont])

  const theme = themes[currentTheme]

  const getAppStyle = () => {
    const baseStyle = {
      color: theme.text,
      minHeight: '100vh',
      fontFamily: currentFont
    }

    if (currentTheme === 'animalcrossing') {
      return {
        ...baseStyle,
        backgroundImage: theme.background,
        backgroundSize: theme.backgroundSize,
        backgroundPosition: theme.backgroundPosition,
        backgroundAttachment: theme.backgroundAttachment
      }
    }

    return {
      ...baseStyle,
      backgroundColor: theme.background
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setCurrentTheme, themes, currentFont, setCurrentFont }}>
      <Router>
        <div className="app" style={getAppStyle()}>
          {currentTheme === 'animalcrossing' && (
            <>
              <AnimatedSprite character="racoon" delay={0} side="left" />
              <AnimatedSprite character="white_rat" delay={500} side="right" />
            </>
          )}
          <Navbar />
          <div className="content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/money" element={<ProtectedRoute><Money /></ProtectedRoute>} />
              <Route path="/exercise" element={<ProtectedRoute><Exercise /></ProtectedRoute>} />
              <Route path="/dopamine" element={<ProtectedRoute><Dopamine /></ProtectedRoute>} />
              <Route path="/hobby" element={<ProtectedRoute><Hobby /></ProtectedRoute>} />
              <Route path="/routine" element={<ProtectedRoute><Routine /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            </Routes>
          </div>
        </div>
      </Router>
    </ThemeContext.Provider>
  )
}

export default App
