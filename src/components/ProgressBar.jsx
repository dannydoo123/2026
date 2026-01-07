import { useState, useContext, useEffect, useRef } from 'react'
import { ThemeContext } from '../App'
import './ProgressBar.css'

function ProgressBar({ progress, count, goal, setGoal }) {
  const { theme } = useContext(ThemeContext)
  const [isEditing, setIsEditing] = useState(false)
  const [tempGoal, setTempGoal] = useState(goal)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [particles, setParticles] = useState([])
  const [lastMilestone, setLastMilestone] = useState(0)
  const progressRef = useRef(0)

  // Counter animation for progress percentage
  useEffect(() => {
    const duration = 1000 // 1 second
    const startValue = progressRef.current
    const endValue = progress
    const startTime = Date.now()

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progressRatio = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progressRatio, 3)
      const currentValue = startValue + (endValue - startValue) * easeOut

      setDisplayProgress(currentValue)

      if (progressRatio < 1) {
        requestAnimationFrame(animate)
      } else {
        progressRef.current = endValue
      }
    }

    requestAnimationFrame(animate)
  }, [progress])

  // Particle burst on milestones
  useEffect(() => {
    const milestones = [25, 50, 75, 100]
    const currentMilestone = milestones.find(m => progress >= m && lastMilestone < m)

    if (currentMilestone) {
      setLastMilestone(currentMilestone)
      createParticleBurst(currentMilestone)
    }
  }, [progress, lastMilestone])

  const createParticleBurst = (milestone) => {
    const particleCount = 20
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: Date.now() + i,
      angle: (360 / particleCount) * i,
      color: milestone === 100 ? '#4caf50' : theme.accent
    }))

    setParticles(prev => [...prev, ...newParticles])

    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 1000)
  }

  const handleSaveGoal = () => {
    if (tempGoal > 0) {
      setGoal(tempGoal)
      setIsEditing(false)
    }
  }

  const barProgress = Math.min(progress, 100)
  const overProgress = progress > 100 ? progress - 100 : 0

  return (
    <div className="progress-container">
      <div className="progress-header">
        <div className="goal-display" style={{ color: theme.text }}>
          <span className="goal-label">이번 달 목표:</span>
          {isEditing ? (
            <div className="goal-edit">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
                min="1"
                className="goal-input"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `2px solid ${theme.accent}`
                }}
              />
              <span style={{ color: theme.text }}>일</span>
              <button
                onClick={handleSaveGoal}
                className="goal-button save"
                style={{
                  backgroundColor: theme.accent,
                  color: '#fff'
                }}
              >
                저장
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setTempGoal(goal)
                }}
                className="goal-button cancel"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `2px solid ${theme.accent}`
                }}
              >
                취소
              </button>
            </div>
          ) : (
            <>
              <span className="goal-value">{goal}일</span>
              <button
                onClick={() => setIsEditing(true)}
                className="goal-button edit"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `2px solid ${theme.accent}`
                }}
              >
                변경
              </button>
            </>
          )}
        </div>
      </div>

      <div className="progress-info" style={{ color: theme.text }}>
        <span className="progress-count">{count}일 완료</span>
        <span className="progress-percentage">
          {displayProgress.toFixed(1)}%
          {overProgress > 0 && (
            <span className="over-progress"> (+{overProgress.toFixed(1)}%)</span>
          )}
        </span>
      </div>

      <div className="progress-bar-wrapper">
        <div
          className={`progress-bar-container ${progress >= 75 ? 'glowing' : ''}`}
          style={{ backgroundColor: theme.card }}
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${barProgress}%`,
              backgroundColor: progress >= 100 ? '#4caf50' : theme.accent
            }}
          >
            <div className="wave"></div>
            <div className="wave wave-2"></div>
            {progress >= 100 && (
              <div
                className="progress-bar-overflow"
                style={{
                  width: `${(overProgress / barProgress) * 100}%`,
                  backgroundColor: '#81c784'
                }}
              ></div>
            )}
          </div>
        </div>

        {/* Particle burst container */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              '--angle': `${particle.angle}deg`,
              backgroundColor: particle.color
            }}
          />
        ))}
      </div>

      {progress >= 100 && (
        <div className="achievement-message" style={{ color: theme.accent }}>
          🎉 목표 달성! 계속 힘내세요! 🎉
        </div>
      )}
    </div>
  )
}

export default ProgressBar
