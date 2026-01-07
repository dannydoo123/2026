import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../App'
import Calendar from '../components/CalendarNew'
import ProgressBar from '../components/ProgressBar'
import './Exercise.css'

function Exercise() {
  const { theme } = useContext(ThemeContext)
  const [exerciseDays, setExerciseDays] = useState(() => {
    const saved = localStorage.getItem('exerciseDays')
    return saved ? JSON.parse(saved) : {}
  })
  const [dayNotes, setDayNotes] = useState(() => {
    const saved = localStorage.getItem('dayNotes')
    return saved ? JSON.parse(saved) : {}
  })
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const saved = localStorage.getItem('monthlyGoal')
    return saved ? parseInt(saved) : 20
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [focusedMonth, setFocusedMonth] = useState(null) // null = year view, number = specific month

  useEffect(() => {
    localStorage.setItem('exerciseDays', JSON.stringify(exerciseDays))
  }, [exerciseDays])

  useEffect(() => {
    localStorage.setItem('dayNotes', JSON.stringify(dayNotes))
  }, [dayNotes])

  useEffect(() => {
    localStorage.setItem('monthlyGoal', monthlyGoal.toString())
  }, [monthlyGoal])

  const toggleExerciseDay = (dateString) => {
    setExerciseDays(prev => {
      const newDays = { ...prev }
      if (newDays[dateString]) {
        delete newDays[dateString]
      } else {
        newDays[dateString] = true
      }
      return newDays
    })
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

  const setDayNote = (dateString, note) => {
    setDayNotes(prev => {
      const newNotes = { ...prev }
      if (note && note.trim()) {
        newNotes[dateString] = note.trim()
      } else {
        delete newNotes[dateString]
      }
      return newNotes
    })
  }

  const getDayNote = (dateString) => {
    return dayNotes[dateString] || ''
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
        setGoal={setMonthlyGoal}
      />
    </div>
  )
}

export default Exercise
