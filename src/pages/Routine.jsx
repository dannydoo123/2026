import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getRoutineCompletions,
  toggleRoutineCompletion
} from '../lib/database'
import { formatLocalDate } from '../utils/dateHelpers'
import './Routine.css'

function Routine() {
  const { theme } = useContext(ThemeContext)
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [routines, setRoutines] = useState([])
  const [completions, setCompletions] = useState({})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [routineForm, setRoutineForm] = useState({
    time: '09:00',
    activity: ''
  })

  const todayString = formatLocalDate(currentDate)

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)
        const [routinesData, completionsData] = await Promise.all([
          getRoutines(),
          getRoutineCompletions(todayString)
        ])

        setRoutines(routinesData)

        // Convert completions array to map for easier lookup
        const completionsMap = {}
        completionsData.forEach(completion => {
          completionsMap[completion.routine_id] = true
        })
        setCompletions(completionsMap)

        setLoading(false)
      } catch (error) {
        console.error('Error loading routine data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [user, todayString])

  const openAddModal = () => {
    setEditingRoutine(null)
    setRoutineForm({
      time: '09:00',
      activity: ''
    })
    setShowModal(true)
  }

  const openEditModal = (routine) => {
    setEditingRoutine(routine.id)
    setRoutineForm({
      time: routine.time,
      activity: routine.activity
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRoutine(null)
  }

  const saveRoutine = async () => {
    if (!routineForm.activity.trim()) {
      alert('Please enter an activity')
      return
    }

    try {
      if (editingRoutine) {
        await updateRoutine(editingRoutine, {
          time: routineForm.time,
          activity: routineForm.activity.trim(),
          isActive: true
        })
        setRoutines(prev => prev.map(r =>
          r.id === editingRoutine
            ? { ...r, time: routineForm.time, activity: routineForm.activity.trim() }
            : r
        ))
      } else {
        const newRoutine = await createRoutine({
          time: routineForm.time,
          activity: routineForm.activity.trim()
        })
        setRoutines(prev => [...prev, newRoutine].sort((a, b) =>
          a.time.localeCompare(b.time)
        ))
      }

      closeModal()
    } catch (error) {
      console.error('Error saving routine:', error)
      alert('Failed to save routine')
    }
  }

  const handleDeleteRoutine = async (routineId) => {
    if (window.confirm('Delete this routine?')) {
      try {
        await deleteRoutine(routineId)
        setRoutines(prev => prev.filter(r => r.id !== routineId))
        setCompletions(prev => {
          const newCompletions = { ...prev }
          delete newCompletions[routineId]
          return newCompletions
        })
      } catch (error) {
        console.error('Error deleting routine:', error)
        alert('Failed to delete routine')
      }
    }
  }

  const handleToggleCompletion = async (routineId) => {
    try {
      await toggleRoutineCompletion(routineId, todayString)
      setCompletions(prev => ({
        ...prev,
        [routineId]: !prev[routineId]
      }))
    } catch (error) {
      console.error('Error toggling completion:', error)
      alert('Failed to update completion')
    }
  }

  const formatTime = (timeString) => {
    // timeString is in format "HH:MM:SS" from database
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${period}`
  }

  const getCompletionPercentage = () => {
    if (routines.length === 0) return 0
    const completed = Object.values(completions).filter(Boolean).length
    return Math.round((completed / routines.length) * 100)
  }

  if (loading) {
    return (
      <div className="routine-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: theme.text, fontSize: '24px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="routine-page">
      <h1 style={{ color: theme.text }}>일과</h1>

      {/* Progress Card */}
      <div className="routine-progress-card" style={{ backgroundColor: theme.card }}>
        <div className="progress-header">
          <h2 style={{ color: theme.text }}>Today's Progress</h2>
          <div className="completion-percentage" style={{ color: theme.accent }}>
            {getCompletionPercentage()}%
          </div>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${getCompletionPercentage()}%`,
              backgroundColor: theme.accent
            }}
          />
        </div>
        <p style={{ color: theme.text, opacity: 0.8, marginTop: '12px' }}>
          {Object.values(completions).filter(Boolean).length} of {routines.length} completed
        </p>
      </div>

      {/* Routines List */}
      <div className="routines-container">
        <div className="routines-header">
          <h2 style={{ color: theme.text }}>Daily Routines</h2>
          <button
            className="add-routine-btn"
            onClick={openAddModal}
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            + Add Routine
          </button>
        </div>

        {routines.length === 0 ? (
          <div className="empty-state" style={{ backgroundColor: theme.card, color: theme.text }}>
            <p>No routines yet. Create your first routine to get started!</p>
          </div>
        ) : (
          <div className="routines-list">
            {routines.map((routine) => (
              <div
                key={routine.id}
                className={`routine-item ${completions[routine.id] ? 'completed' : ''}`}
                style={{
                  backgroundColor: theme.card,
                  borderLeft: completions[routine.id] ? `4px solid ${theme.accent}` : '4px solid transparent'
                }}
              >
                <div className="routine-checkbox">
                  <input
                    type="checkbox"
                    checked={!!completions[routine.id]}
                    onChange={() => handleToggleCompletion(routine.id)}
                    style={{ accentColor: theme.accent }}
                  />
                </div>
                <div className="routine-content">
                  <div className="routine-time" style={{ color: theme.accent }}>
                    {formatTime(routine.time)}
                  </div>
                  <div
                    className="routine-activity"
                    style={{
                      color: theme.text,
                      textDecoration: completions[routine.id] ? 'line-through' : 'none',
                      opacity: completions[routine.id] ? 0.6 : 1
                    }}
                  >
                    {routine.activity}
                  </div>
                </div>
                <div className="routine-actions">
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(routine)}
                    style={{ color: theme.text }}
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteRoutine(routine.id)}
                    style={{ color: '#FF6B6B' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal routine-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${theme.accent}` }}
          >
            <h3>{editingRoutine ? 'Edit Routine' : 'New Routine'}</h3>

            <div className="modal-field">
              <label>Time</label>
              <input
                type="time"
                value={routineForm.time}
                onChange={(e) => setRoutineForm({ ...routineForm, time: e.target.value })}
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.accent}`,
                  width: '100%',
                  padding: '8px'
                }}
              />
            </div>

            <div className="modal-field">
              <label>Activity</label>
              <input
                type="text"
                value={routineForm.activity}
                onChange={(e) => setRoutineForm({ ...routineForm, activity: e.target.value })}
                placeholder="e.g., Wake up, Check work email, Exercise"
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.accent}`
                }}
              />
            </div>

            <div className="modal-buttons">
              <button
                onClick={saveRoutine}
                className="save-button"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                Save
              </button>
              <button
                onClick={closeModal}
                className="cancel-button"
                style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${theme.accent}` }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Routine
