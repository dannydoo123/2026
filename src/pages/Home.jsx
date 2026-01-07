import { useContext } from 'react'
import { ThemeContext } from '../App'
import './Page.css'

function Home() {
  const { theme } = useContext(ThemeContext)

  return (
    <div className="page">
      <h1 style={{ color: theme.text }}>홈</h1>
      <div className="empty-state" style={{ color: theme.text }}>
        대시보드가 여기에 표시됩니다
      </div>
    </div>
  )
}

export default Home
