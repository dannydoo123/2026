import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getRoutineCompletions,
  getRoutineCompletionsRange,
  toggleRoutineCompletion,
  getTasks,
  getTasksRange,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion
} from '../lib/database'
import { formatLocalDate, getTodayLocal, parseLocalDate } from '../utils/dateHelpers'
import './Routine.css'

function Routine() {
  const { theme } = useContext(ThemeContext)
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [routines, setRoutines] = useState([])
  const [completions, setCompletions] = useState({})
  const [tasks, setTasks] = useState([])
  const [currentDate, setCurrentDate] = useState(getTodayLocal())
  const [viewMode, setViewMode] = useState('daily') // 'daily' or 'weekly'
  const [showRoutineModal, setShowRoutineModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [routineForm, setRoutineForm] = useState({
    time: '09:00',
    activity: ''
  })
  const [taskForm, setTaskForm] = useState({
    date: '',
    time: '09:00',
    title: '',
    description: ''
  })

  const todayString = formatLocalDate(currentDate)
  const isToday = formatLocalDate(getTodayLocal()) === todayString

  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)

        if (viewMode === 'daily') {
          const [routinesData, completionsData, tasksData] = await Promise.all([
            getRoutines(),
            getRoutineCompletions(todayString),
            getTasks(todayString)
          ])

          setRoutines(routinesData)

          // Convert completions array to map for easier lookup
          const completionsMap = {}
          completionsData.forEach(completion => {
            completionsMap[completion.routine_id] = true
          })
          setCompletions(completionsMap)
          setTasks(tasksData)
        } else {
          // Weekly view: get data for 7 days starting from currentDate
          const weekDates = []
          for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate)
            date.setDate(date.getDate() + i)
            weekDates.push(formatLocalDate(date))
          }

          const startDate = weekDates[0]
          const endDate = weekDates[6]

          const [routinesData, completionsData, tasksData] = await Promise.all([
            getRoutines(),
            getRoutineCompletionsRange(startDate, endDate),
            getTasksRange(startDate, endDate)
          ])

          setRoutines(routinesData)

          // Convert completions array to map by routine_id and date
          const completionsMap = {}
          completionsData.forEach(completion => {
            const key = `${completion.routine_id}_${completion.date}`
            completionsMap[key] = true
          })
          setCompletions(completionsMap)
          setTasks(tasksData)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading routine data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [user, todayString, viewMode, currentDate])

  const openAddRoutineModal = () => {
    setEditingRoutine(null)
    setRoutineForm({
      time: '09:00',
      activity: ''
    })
    setShowRoutineModal(true)
  }

  const openEditRoutineModal = (routine) => {
    setEditingRoutine(routine.id)
    setRoutineForm({
      time: routine.time,
      activity: routine.activity
    })
    setShowRoutineModal(true)
  }

  const closeRoutineModal = () => {
    setShowRoutineModal(false)
    setEditingRoutine(null)
  }

  const openAddTaskModal = () => {
    setEditingTask(null)
    setTaskForm({
      date: todayString,
      time: '09:00',
      title: '',
      description: ''
    })
    setShowTaskModal(true)
  }

  const openEditTaskModal = (task) => {
    setEditingTask(task.id)
    setTaskForm({
      date: task.date,
      time: task.time,
      title: task.title,
      description: task.description || ''
    })
    setShowTaskModal(true)
  }

  const closeTaskModal = () => {
    setShowTaskModal(false)
    setEditingTask(null)
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

      closeRoutineModal()
    } catch (error) {
      console.error('Error saving routine:', error)
      alert('Failed to save routine')
    }
  }

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      alert('Please enter a task title')
      return
    }

    try {
      if (editingTask) {
        await updateTask(editingTask, {
          date: taskForm.date,
          time: taskForm.time,
          title: taskForm.title.trim(),
          description: taskForm.description.trim(),
          completed: false
        })
        setTasks(prev => prev.map(t =>
          t.id === editingTask
            ? { ...t, date: taskForm.date, time: taskForm.time, title: taskForm.title.trim(), description: taskForm.description.trim() }
            : t
        ))
      } else {
        const newTask = await createTask({
          date: taskForm.date,
          time: taskForm.time,
          title: taskForm.title.trim(),
          description: taskForm.description.trim()
        })
        setTasks(prev => [...prev, newTask].sort((a, b) =>
          a.time.localeCompare(b.time)
        ))
      }

      closeTaskModal()
    } catch (error) {
      console.error('Error saving task:', error)
      alert('Failed to save task')
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

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteTask(taskId)
        setTasks(prev => prev.filter(t => t.id !== taskId))
      } catch (error) {
        console.error('Error deleting task:', error)
        alert('Failed to delete task')
      }
    }
  }

  const handleToggleCompletion = async (routineId, date = null) => {
    try {
      const completionDate = date || todayString
      await toggleRoutineCompletion(routineId, completionDate)

      if (viewMode === 'daily') {
        setCompletions(prev => ({
          ...prev,
          [routineId]: !prev[routineId]
        }))
      } else {
        const key = `${routineId}_${completionDate}`
        setCompletions(prev => ({
          ...prev,
          [key]: !prev[key]
        }))
      }
    } catch (error) {
      console.error('Error toggling completion:', error)
      alert('Failed to update completion')
    }
  }

  const handleToggleTaskCompletion = async (taskId) => {
    try {
      const updatedTask = await toggleTaskCompletion(taskId)
      setTasks(prev => prev.map(t =>
        t.id === taskId ? updatedTask : t
      ))
    } catch (error) {
      console.error('Error toggling task completion:', error)
      alert('Failed to update task')
    }
  }

  const changeDate = (days) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(getTodayLocal())
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: theme.text, margin: 0 }}>일과</h1>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setViewMode('daily')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'daily' ? theme.accent : theme.card,
              color: viewMode === 'daily' ? '#fff' : theme.text,
              border: `2px solid ${theme.accent}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Daily View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'weekly' ? theme.accent : theme.card,
              color: viewMode === 'weekly' ? '#fff' : theme.text,
              border: `2px solid ${theme.accent}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Weekly View
          </button>
        </div>
      </div>

      {viewMode === 'daily' ? (
        <>
          {/* Date Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <button
              onClick={() => changeDate(-1)}
              style={{
                padding: '8px 16px',
                backgroundColor: theme.card,
                color: theme.text,
                border: `2px solid ${theme.accent}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ◀
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ color: theme.text, margin: 0 }}>
                {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h2>
              {!isToday && (
                <button
                  onClick={goToToday}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: theme.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Today
                </button>
              )}
            </div>
            <button
              onClick={() => changeDate(1)}
              style={{
                padding: '8px 16px',
                backgroundColor: theme.card,
                color: theme.text,
                border: `2px solid ${theme.accent}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ▶
            </button>
          </div>

          {/* Progress Card */}
          {isToday && (
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
          )}

          {/* Routines List */}
          <div className="routines-container">
            <div className="routines-header">
              <h2 style={{ color: theme.text }}>Daily Routines</h2>
              <button
                className="add-routine-btn"
                onClick={openAddRoutineModal}
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
                    onClick={() => openEditRoutineModal(routine)}
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

          {/* Tasks Section */}
          <div className="routines-container" style={{ marginTop: '30px' }}>
            <div className="routines-header">
              <h2 style={{ color: theme.text }}>Tasks</h2>
              <button
                className="add-routine-btn"
                onClick={openAddTaskModal}
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                + Add Task
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state" style={{ backgroundColor: theme.card, color: theme.text }}>
                <p>No tasks for {isToday ? 'today' : 'this date'}. Add a task to get started!</p>
              </div>
            ) : (
              <div className="routines-list">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`routine-item ${task.completed ? 'completed' : ''}`}
                    style={{
                      backgroundColor: theme.card,
                      borderLeft: task.completed ? `4px solid ${theme.accent}` : '4px solid transparent'
                    }}
                  >
                    <div className="routine-checkbox">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTaskCompletion(task.id)}
                        style={{ accentColor: theme.accent }}
                      />
                    </div>
                    <div className="routine-content">
                      <div className="routine-time" style={{ color: theme.accent }}>
                        {formatTime(task.time)}
                      </div>
                      <div
                        className="routine-activity"
                        style={{
                          color: theme.text,
                          textDecoration: task.completed ? 'line-through' : 'none',
                          opacity: task.completed ? 0.6 : 1
                        }}
                      >
                        <div style={{ fontWeight: '600' }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '4px' }}>
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="routine-actions">
                      <button
                        className="edit-btn"
                        onClick={() => openEditTaskModal(task)}
                        style={{ color: theme.text }}
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteTask(task.id)}
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
        </>
      ) : (
        /* Weekly View */
        <div className="weekly-view">
          {(() => {
            const weekDays = []
            for (let i = 0; i < 7; i++) {
              const date = new Date(currentDate)
              date.setDate(date.getDate() + i)
              weekDays.push(date)
            }

            return (
              <>
                {/* Week Navigation */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  <button
                    onClick={() => changeDate(-7)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: theme.card,
                      color: theme.text,
                      border: `2px solid ${theme.accent}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ◀
                  </button>
                  <h2 style={{ color: theme.text, margin: 0 }}>
                    {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h2>
                  <button
                    onClick={() => changeDate(7)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: theme.card,
                      color: theme.text,
                      border: `2px solid ${theme.accent}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ▶
                  </button>
                </div>

                {/* Weekly Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '15px' }}>
                  {weekDays.map((date, dayIndex) => {
                    const dateString = formatLocalDate(date)
                    const dayTasks = tasks.filter(t => t.date === dateString)
                    const isTodayDate = formatLocalDate(getTodayLocal()) === dateString

                    return (
                      <div
                        key={dayIndex}
                        style={{
                          backgroundColor: theme.card,
                          padding: '15px',
                          borderRadius: '10px',
                          border: isTodayDate ? `3px solid ${theme.accent}` : 'none'
                        }}
                      >
                        <div style={{
                          textAlign: 'center',
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: `2px solid ${theme.accent}`
                        }}>
                          <div style={{ color: theme.text, fontSize: '0.85rem', opacity: 0.7 }}>
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div style={{ color: theme.text, fontSize: '1.2rem', fontWeight: '700', marginTop: '4px' }}>
                            {date.getDate()}
                          </div>
                        </div>

                        {/* Routines for this day */}
                        <div style={{ marginBottom: '15px' }}>
                          <div style={{ color: theme.text, fontSize: '0.75rem', opacity: 0.6, marginBottom: '8px', fontWeight: '600' }}>
                            Routines
                          </div>
                          {routines.map(routine => {
                            const completionKey = `${routine.id}_${dateString}`
                            const isCompleted = completions[completionKey]

                            return (
                              <div
                                key={routine.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginBottom: '6px',
                                  padding: '4px',
                                  backgroundColor: theme.background,
                                  borderRadius: '4px'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!isCompleted}
                                  onChange={() => handleToggleCompletion(routine.id, dateString)}
                                  style={{ accentColor: theme.accent, transform: 'scale(0.8)' }}
                                />
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: theme.text,
                                  textDecoration: isCompleted ? 'line-through' : 'none',
                                  opacity: isCompleted ? 0.5 : 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {routine.activity}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Tasks for this day */}
                        <div>
                          <div style={{ color: theme.text, fontSize: '0.75rem', opacity: 0.6, marginBottom: '8px', fontWeight: '600' }}>
                            Tasks ({dayTasks.length})
                          </div>
                          {dayTasks.length === 0 ? (
                            <div style={{ fontSize: '0.7rem', color: theme.text, opacity: 0.4, fontStyle: 'italic' }}>
                              No tasks
                            </div>
                          ) : (
                            dayTasks.map(task => (
                              <div
                                key={task.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginBottom: '6px',
                                  padding: '4px',
                                  backgroundColor: theme.background,
                                  borderRadius: '4px'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => handleToggleTaskCompletion(task.id)}
                                  style={{ accentColor: theme.accent, transform: 'scale(0.8)' }}
                                />
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: theme.text,
                                  textDecoration: task.completed ? 'line-through' : 'none',
                                  opacity: task.completed ? 0.5 : 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {task.title}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Routine Modal */}
      {showRoutineModal && (
        <div className="modal-overlay" onClick={closeRoutineModal}>
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
                onClick={closeRoutineModal}
                className="cancel-button"
                style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${theme.accent}` }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div
            className="modal routine-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${theme.accent}` }}
          >
            <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>

            <div className="modal-field">
              <label>Date</label>
              <input
                type="date"
                value={taskForm.date}
                onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
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
              <label>Time</label>
              <input
                type="time"
                value={taskForm.time}
                onChange={(e) => setTaskForm({ ...taskForm, time: e.target.value })}
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
              <label>Title</label>
              <input
                type="text"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g., Meet person for marketplace, Buy groceries"
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.accent}`
                }}
              />
            </div>

            <div className="modal-field">
              <label>Description (Optional)</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Additional details..."
                rows="3"
                style={{
                  backgroundColor: theme.background,
                  color: theme.text,
                  border: `1px solid ${theme.accent}`,
                  width: '100%',
                  padding: '8px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div className="modal-buttons">
              <button
                onClick={saveTask}
                className="save-button"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                Save
              </button>
              <button
                onClick={closeTaskModal}
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
