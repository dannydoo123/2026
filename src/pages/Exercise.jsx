import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import {
  getExerciseDays,
  upsertExerciseDay,
  deleteExerciseDay,
  getExerciseNotes,
  upsertExerciseNote,
  getUserSettings,
  updateUserSettings
} from '../lib/database'
import Calendar from '../components/CalendarNew'
import ProgressBar from '../components/ProgressBar'
import './Exercise.css'

function Exercise() {
  const { theme } = useContext(ThemeContext)
  const { user } = useAuth()
  const [exerciseDays, setExerciseDays] = useState({})
  const [dayNotes, setDayNotes] = useState({})
  const [monthlyGoal, setMonthlyGoal] = useState(20)
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [focusedMonth, setFocusedMonth] = useState(null) // null = year view, number = specific month

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)
        const [days, notes, settings] = await Promise.all([
          getExerciseDays(),
          getExerciseNotes(),
          getUserSettings()
        ])

        // Transform to object format
        const daysObj = {}
        days.forEach(day => {
          daysObj[day.date] = day.completed
        })

        const notesObj = {}
        notes.forEach(note => {
          notesObj[note.date] = note.note
        })

        setExerciseDays(daysObj)
        setDayNotes(notesObj)
        if (settings?.exercise_monthly_goal) {
          setMonthlyGoal(settings.exercise_monthly_goal)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error loading exercise data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const toggleExerciseDay = async (dateString) => {
    try {
      if (exerciseDays[dateString]) {
        await deleteExerciseDay(dateString)
        setExerciseDays(prev => {
          const newDays = { ...prev }
          delete newDays[dateString]
          return newDays
        })
      } else {
        await upsertExerciseDay(dateString, true)
        setExerciseDays(prev => ({
          ...prev,
          [dateString]: true
        }))
      }
    } catch (error) {
      console.error('Error toggling exercise day:', error)
      alert('Failed to update exercise day')
    }
  }

  const getMonthProgress = (year, month) => {
    const count = Object.keys(exerciseDays).filter(dateStr => {
      const date = new Date(dateStr)
      return date.getFullYear() === year && date.getMonth() === month
    }).length
    return (count / monthlyGoal) * 100
  }

  const getMonthCount = (year, month) => {
    return Object.keys(exerciseDays).filter(dateStr => {
      const date = new Date(dateStr)
      return date.getFullYear() === year && date.getMonth() === month
    }).length
  }

  const handleFocusedMonthChange = (monthIndex) => {
    setFocusedMonth(monthIndex)
  }

  // Use focused month for progress bar, or current month if in year view
  const displayMonth = focusedMonth !== null ? focusedMonth : new Date().getMonth()

  const setDayNote = async (dateString, note) => {
    try {
      await upsertExerciseNote(dateString, note)
      setDayNotes(prev => {
        const newNotes = { ...prev }
        if (note && note.trim()) {
          newNotes[dateString] = note.trim()
        } else {
          delete newNotes[dateString]
        }
        return newNotes
      })
    } catch (error) {
      console.error('Error saving note:', error)
      alert('Failed to save note')
    }
  }

  const getDayNote = (dateString) => {
    return dayNotes[dateString] || ''
  }

  const handleSetGoal = async (newGoal) => {
    try {
      await updateUserSettings({ exercise_monthly_goal: newGoal })
      setMonthlyGoal(newGoal)
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Failed to update goal')
    }
  }

  if (loading) {
    return (
      <div className="exercise-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: theme.text, fontSize: '24px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="exercise-page">
      <h1 style={{ color: theme.text }}>운동 관리</h1>

      <Calendar
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        exerciseDays={exerciseDays}
        toggleExerciseDay={toggleExerciseDay}
        dayNotes={dayNotes}
        setDayNote={setDayNote}
        getDayNote={getDayNote}
        onFocusedMonthChange={handleFocusedMonthChange}
      />

      <ProgressBar
        progress={getMonthProgress(currentDate.getFullYear(), displayMonth)}
        count={getMonthCount(currentDate.getFullYear(), displayMonth)}
        goal={monthlyGoal}
        setGoal={handleSetGoal}
      />
    </div>
  )
}

export default Exercise
