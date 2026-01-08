import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import {
  getTransactions,
  getExerciseDays,
  getDopamineCategories,
  getDopamineEntries,
  getHobbyCategories,
  getHobbyEntries,
  getRoutines,
  getRoutineCompletions,
  getUserSettings
} from '../lib/database'
import { formatLocalDate } from '../utils/dateHelpers'
import './Home.css'

function Home() {
  const { theme } = useContext(ThemeContext)
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState({ text: '', author: '' })
  const [showConfetti, setShowConfetti] = useState(false)

  // Data states
  const [moneyData, setMoneyData] = useState({ balance: 0, trend: 0, status: 'good' })
  const [exerciseData, setExerciseData] = useState({ count: 0, goal: 20, streak: 0, status: 'good' })
  const [dopamineData, setDopamineData] = useState({ streaks: [], warnings: [], status: 'good' })
  const [hobbyData, setHobbyData] = useState({ streaks: [], totalWeeklyHours: 0, status: 'good' })
  const [routineData, setRoutineData] = useState({ completed: 0, total: 0, percentage: 0, status: 'good' })

  const motivationalQuotes = [
    { text: "Every day is a new beginning. Take a deep breath and start again.", author: "Unknown" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Your future is created by what you do today, not tomorrow.", author: "Unknown" },
    { text: "Small progress is still progress.", author: "Unknown" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Dream big, start small, act now.", author: "Robin Sharma" }
  ]

  useEffect(() => {
    // Select random quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    setQuote(randomQuote)
  }, [])

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return

      try {
        setLoading(true)

        // Load all data in parallel
        const [transactions, exerciseDays, dopamineCategories, hobbyCategories, routines, routineCompletions, settings] = await Promise.all([
          getTransactions(),
          getExerciseDays(),
          getDopamineCategories(),
          getHobbyCategories(),
          getRoutines(),
          getRoutineCompletions(formatLocalDate(today)),
          getUserSettings()
        ])

        // Calculate Money Data
        const today = new Date()
        const thisMonth = today.getMonth()
        const thisYear = today.getFullYear()
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

        const thisMonthTransactions = transactions.filter(t => {
          const date = new Date(t.date)
          return date.getMonth() === thisMonth && date.getFullYear() === thisYear
        })

        const lastMonthTransactions = transactions.filter(t => {
          const date = new Date(t.date)
          return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
        })

        const thisMonthBalance = thisMonthTransactions.reduce((sum, t) => {
          return sum + (t.type === 'income' ? t.amount : -t.amount)
        }, 0)

        const lastMonthBalance = lastMonthTransactions.reduce((sum, t) => {
          return sum + (t.type === 'income' ? t.amount : -t.amount)
        }, 0)

        const moneyTrend = lastMonthBalance !== 0
          ? ((thisMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100
          : 0

        const moneyStatus = thisMonthBalance >= 0 ? 'good' : 'alert'

        setMoneyData({ balance: thisMonthBalance, trend: moneyTrend, status: moneyStatus })

        // Calculate Exercise Data
        const exerciseGoal = settings?.exercise_monthly_goal || 20
        const thisMonthExercise = exerciseDays.filter(d => {
          const date = new Date(d.date)
          return date.getMonth() === thisMonth && date.getFullYear() === thisYear && d.completed
        }).length

        let exerciseStreak = 0
        for (let i = 0; i < 365; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateString = formatLocalDate(date)
          const hasExercised = exerciseDays.some(d => d.date === dateString && d.completed)
          if (!hasExercised) break
          exerciseStreak++
        }

        const exerciseProgress = thisMonthExercise / exerciseGoal
        const exerciseStatus = exerciseProgress >= 0.8 ? 'good' : exerciseProgress >= 0.5 ? 'warning' : 'alert'

        setExerciseData({
          count: thisMonthExercise,
          goal: exerciseGoal,
          streak: exerciseStreak,
          status: exerciseStatus
        })

        // Calculate Dopamine Data
        const dopamineStreaks = []
        const dopamineWarnings = []

        for (const cat of dopamineCategories) {
          const entries = await getDopamineEntries(cat.id)

          if (cat.goal_type === 'abstinence') {
            let streak = 0
            for (let i = 0; i < 365; i++) {
              const date = new Date(today)
              date.setDate(date.getDate() - i)
              const dateString = formatLocalDate(date)
              const entry = entries.find(e => e.date === dateString)
              if (entry && entry.value > 0) break
              streak++
            }
            dopamineStreaks.push({ name: cat.name, streak, color: cat.color })
          }

          // Check today's entry for warnings
          const todayString = formatLocalDate(today)
          const todayEntry = entries.find(e => e.date === todayString)
          if (todayEntry && cat.goal_type === 'limit' && todayEntry.value > cat.goal_value) {
            dopamineWarnings.push(cat.name)
          }
          if (todayEntry && cat.goal_type === 'abstinence' && todayEntry.value > 0) {
            dopamineWarnings.push(cat.name)
          }
        }

        const dopamineStatus = dopamineWarnings.length === 0 ? 'good' : 'alert'
        setDopamineData({ streaks: dopamineStreaks, warnings: dopamineWarnings, status: dopamineStatus })

        // Calculate Hobby Data
        const hobbyStreaks = []
        let totalWeeklyMinutes = 0

        for (const cat of hobbyCategories) {
          const entries = await getHobbyEntries(cat.id)

          if (cat.goal_type === 'target') {
            let streak = 0
            for (let i = 0; i < 365; i++) {
              const date = new Date(today)
              date.setDate(date.getDate() - i)
              const dateString = formatLocalDate(date)
              const entry = entries.find(e => e.date === dateString)
              if (!entry || entry.value < cat.goal_value) break
              streak++
            }
            hobbyStreaks.push({ name: cat.name, streak, color: cat.color })
          }

          // Calculate weekly total
          for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            const dateString = formatLocalDate(date)
            const entry = entries.find(e => e.date === dateString)
            if (entry) {
              totalWeeklyMinutes += entry.value
            }
          }
        }

        const hobbyStatus = hobbyStreaks.length > 0 && hobbyStreaks.some(s => s.streak > 0) ? 'good' : 'warning'
        setHobbyData({
          streaks: hobbyStreaks,
          totalWeeklyHours: totalWeeklyMinutes / 60,
          status: hobbyStatus
        })

        // Calculate Routine Data
        const routineTotal = routines.length
        const routineCompleted = routineCompletions.length
        const routinePercentage = routineTotal > 0 ? Math.round((routineCompleted / routineTotal) * 100) : 0
        const routineStatus = routinePercentage >= 80 ? 'good' : routinePercentage >= 50 ? 'warning' : 'alert'

        setRoutineData({
          completed: routineCompleted,
          total: routineTotal,
          percentage: routinePercentage,
          status: routineStatus
        })

        // Check if all goals are met today - show confetti!
        const allGoodToday = exerciseStatus === 'good' && dopamineStatus === 'good' && hobbyStatus === 'good' && routineStatus === 'good'
        if (allGoodToday) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const createConfetti = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE']
    const confettiElements = []

    for (let i = 0; i < 50; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const left = Math.random() * 100
      const delay = Math.random() * 0.5

      confettiElements.push(
        <div
          key={i}
          className="confetti"
          style={{
            left: `${left}%`,
            backgroundColor: color,
            animationDelay: `${delay}s`
          }}
        />
      )
    }

    return confettiElements
  }

  if (loading) {
    return (
      <div className="home-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: theme.text, fontSize: '24px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="home-page">
      {showConfetti && createConfetti()}

      <h1 style={{ color: theme.text }}>2026 대시보드</h1>

      {/* Motivational Quote */}
      <div className="motivation-section" style={{ backgroundColor: theme.card }}>
        <div className="motivation-quote" style={{ color: theme.text }}>
          "{quote.text}"
        </div>
        <div className="motivation-author" style={{ color: theme.text }}>
          — {quote.author}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="dashboard-grid">
        {/* Money Card */}
        <Link
          to="/money"
          className="dashboard-card"
          style={{
            backgroundColor: theme.card,
            '--card-color': '#06D6A0',
            '--card-color-light': '#4ECDC4'
          }}
        >
          <div className="card-header">
            <div className="card-title" style={{ color: theme.text }}>
              <span className="card-emoji">💰</span>
              돈
            </div>
            <div className={`card-status status-${moneyData.status}`}>
              {moneyData.status === 'good' ? '✓' : '!'}
              {moneyData.status === 'good' ? 'On Track' : 'Alert'}
            </div>
          </div>

          <div className="card-metrics">
            <div className="metric">
              <span className="metric-label" style={{ color: theme.text }}>This Month</span>
              <span className="metric-value" style={{ color: theme.text }}>
                ${moneyData.balance.toLocaleString()}
                {moneyData.trend !== 0 && (
                  <span className={`trend-indicator ${moneyData.trend > 0 ? 'trend-up' : 'trend-down'}`}>
                    {moneyData.trend > 0 ? '↑' : '↓'}
                  </span>
                )}
              </span>
            </div>
            {moneyData.trend !== 0 && (
              <div className="metric">
                <span className="metric-label" style={{ color: theme.text }}>vs Last Month</span>
                <span className="metric-value" style={{ color: moneyData.trend > 0 ? '#06D6A0' : '#FF6B6B' }}>
                  {Math.abs(moneyData.trend).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Exercise Card */}
        <Link
          to="/exercise"
          className="dashboard-card"
          style={{
            backgroundColor: theme.card,
            '--card-color': '#FF6B6B',
            '--card-color-light': '#FFA07A'
          }}
        >
          <div className="card-header">
            <div className="card-title" style={{ color: theme.text }}>
              <span className="card-emoji">💪</span>
              운동
            </div>
            <div className={`card-status status-${exerciseData.status}`}>
              {exerciseData.status === 'good' ? '✓' : exerciseData.status === 'warning' ? '⚠' : '!'}
              {exerciseData.status === 'good' ? 'On Track' : exerciseData.status === 'warning' ? 'Keep Going' : 'Behind'}
            </div>
          </div>

          <div className="progress-circle-container">
            <div className="progress-circle">
              <svg width="120" height="120">
                <circle
                  className="progress-circle-bg"
                  cx="60"
                  cy="60"
                  r="52"
                />
                <circle
                  className="progress-circle-fill"
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="#FF6B6B"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - exerciseData.count / exerciseData.goal)}`}
                />
              </svg>
              <div className="progress-text" style={{ color: theme.text }}>
                {exerciseData.count}/{exerciseData.goal}
              </div>
            </div>
          </div>

          {exerciseData.streak > 0 && (
            <div className="streak-badge" style={{ backgroundColor: 'rgba(255, 107, 107, 0.2)', color: '#FF6B6B' }}>
              🔥 {exerciseData.streak} day streak
            </div>
          )}
        </Link>

        {/* Dopamine Card */}
        <Link
          to="/dopamine"
          className="dashboard-card"
          style={{
            backgroundColor: theme.card,
            '--card-color': '#FFC107',
            '--card-color-light': '#FFD54F'
          }}
        >
          <div className="card-header">
            <div className="card-title" style={{ color: theme.text }}>
              <span className="card-emoji">🎮</span>
              도파민
            </div>
            <div className={`card-status status-${dopamineData.status}`}>
              {dopamineData.status === 'good' ? '✓' : '!'}
              {dopamineData.status === 'good' ? 'Clean' : 'Warning'}
            </div>
          </div>

          <div className="card-metrics">
            {dopamineData.warnings.length > 0 ? (
              <div className="metric">
                <span className="metric-label" style={{ color: '#FF6B6B' }}>
                  ⚠️ Over limit today
                </span>
                <span className="metric-value" style={{ color: '#FF6B6B' }}>
                  {dopamineData.warnings.join(', ')}
                </span>
              </div>
            ) : (
              <div className="metric">
                <span className="metric-label" style={{ color: theme.text }}>Today</span>
                <span className="metric-value" style={{ color: '#06D6A0' }}>
                  ✓ All Good
                </span>
              </div>
            )}

            {dopamineData.streaks.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {dopamineData.streaks.slice(0, 2).map((s, i) => (
                  <div key={i} className="streak-badge" style={{
                    backgroundColor: `${s.color}33`,
                    color: s.color,
                    marginBottom: '8px'
                  }}>
                    {s.name}: {s.streak} days
                  </div>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Hobby Card */}
        <Link
          to="/hobby"
          className="dashboard-card"
          style={{
            backgroundColor: theme.card,
            '--card-color': '#BB8FCE',
            '--card-color-light': '#D7BDE2'
          }}
        >
          <div className="card-header">
            <div className="card-title" style={{ color: theme.text }}>
              <span className="card-emoji">🎨</span>
              취미
            </div>
            <div className={`card-status status-${hobbyData.status}`}>
              {hobbyData.status === 'good' ? '✓' : '⚠'}
              {hobbyData.status === 'good' ? 'Active' : 'Start Today'}
            </div>
          </div>

          <div className="card-metrics">
            <div className="metric">
              <span className="metric-label" style={{ color: theme.text }}>This Week</span>
              <span className="metric-value" style={{ color: theme.text }}>
                {hobbyData.totalWeeklyHours.toFixed(1)}h
              </span>
            </div>

            {hobbyData.streaks.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                {hobbyData.streaks.slice(0, 2).map((s, i) => (
                  <div key={i} className="streak-badge" style={{
                    backgroundColor: `${s.color}33`,
                    color: s.color,
                    marginBottom: '8px'
                  }}>
                    🔥 {s.name}: {s.streak} days
                  </div>
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Routine Card */}
        <Link
          to="/routine"
          className="dashboard-card"
          style={{
            backgroundColor: theme.card,
            '--card-color': '#4ECDC4',
            '--card-color-light': '#45B7D1'
          }}
        >
          <div className="card-header">
            <div className="card-title" style={{ color: theme.text }}>
              <span className="card-emoji">📋</span>
              일과
            </div>
            <div className={`card-status status-${routineData.status}`}>
              {routineData.status === 'good' ? '✓' : routineData.status === 'warning' ? '⚠' : '!'}
              {routineData.status === 'good' ? 'On Track' : routineData.status === 'warning' ? 'Keep Going' : 'Start'}
            </div>
          </div>

          <div className="progress-circle-container">
            <div className="progress-circle">
              <svg width="120" height="120">
                <circle
                  className="progress-circle-bg"
                  cx="60"
                  cy="60"
                  r="52"
                />
                <circle
                  className="progress-circle-fill"
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="#4ECDC4"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - routineData.percentage / 100)}`}
                />
              </svg>
              <div className="progress-text" style={{ color: theme.text }}>
                {routineData.completed}/{routineData.total}
              </div>
            </div>
          </div>

          <div className="metric" style={{ textAlign: 'center', marginTop: '12px' }}>
            <span className="metric-label" style={{ color: theme.text }}>Completion</span>
            <span className="metric-value" style={{ color: theme.text }}>
              {routineData.percentage}%
            </span>
          </div>
        </Link>
      </div>

      {/* Today's Focus */}
      <div className="focus-section" style={{ backgroundColor: theme.card }}>
        <h2 style={{ color: theme.text }}>Today's Focus</h2>
        <div className="focus-items">
          <div className="focus-item">
            <span className="focus-icon">💪</span>
            <span className={`focus-text ${exerciseData.streak > 0 ? 'focus-complete' : ''}`} style={{ color: theme.text }}>
              {exerciseData.streak > 0 ? 'Exercise completed today!' : 'Complete your exercise today'}
            </span>
            {exerciseData.streak > 0 && <span style={{ color: '#06D6A0' }}>✓</span>}
          </div>
          <div className="focus-item">
            <span className="focus-icon">🎮</span>
            <span className={`focus-text ${dopamineData.warnings.length === 0 ? 'focus-complete' : ''}`} style={{ color: theme.text }}>
              {dopamineData.warnings.length === 0 ? 'Staying within dopamine limits' : 'Stay within your dopamine limits'}
            </span>
            {dopamineData.warnings.length === 0 && <span style={{ color: '#06D6A0' }}>✓</span>}
          </div>
          <div className="focus-item">
            <span className="focus-icon">🎨</span>
            <span className="focus-text" style={{ color: theme.text }}>
              Practice your hobbies ({hobbyData.totalWeeklyHours.toFixed(1)}h this week)
            </span>
          </div>
          <div className="focus-item">
            <span className="focus-icon">📋</span>
            <span className={`focus-text ${routineData.percentage === 100 ? 'focus-complete' : ''}`} style={{ color: theme.text }}>
              {routineData.percentage === 100 ? 'All routines completed today!' : `Complete your daily routines (${routineData.completed}/${routineData.total})`}
            </span>
            {routineData.percentage === 100 && <span style={{ color: '#06D6A0' }}>✓</span>}
          </div>
          <div className="focus-item">
            <span className="focus-icon">💰</span>
            <span className="focus-text" style={{ color: theme.text }}>
              Track your expenses
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
