import { useContext, useState, useRef, useEffect } from 'react'
import { ThemeContext } from '../App'
import './CalendarZoom.css'

function Calendar({ currentDate, setCurrentDate, exerciseDays, toggleExerciseDay, dayNotes, setDayNote, getDayNote, onFocusedMonthChange }) {
  const { theme } = useContext(ThemeContext)
  const [noteModal, setNoteModal] = useState({ show: false, date: '', note: '' })
  const [focusedMonth, setFocusedMonth] = useState(new Date().getMonth()) // Start with current month
  const [monthStates, setMonthStates] = useState(() => ({ [new Date().getMonth()]: true })) // Track on/off state for each month
  const longPressTimer = useRef(null)
  const [longPressActive, setLongPressActive] = useState(false)
  const gridRef = useRef(null)
  const [todayDate, setTodayDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' or 'year'

  const year = currentDate.getFullYear()

  // Update today's date in real-time
  useEffect(() => {
    const updateToday = () => {
      setTodayDate(new Date())
    }

    // Calculate milliseconds until next midnight
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const msUntilMidnight = tomorrow - now

    // Set timeout to update at midnight
    const midnightTimeout = setTimeout(() => {
      updateToday()
      // Then check every minute in case of system time changes
      const interval = setInterval(updateToday, 60000)
      return () => clearInterval(interval)
    }, msUntilMidnight)

    return () => clearTimeout(midnightTimeout)
  }, [todayDate])

  const getDaysInMonth = (month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month) => {
    return new Date(year, month, 1).getDay()
  }

  const isExerciseDay = (dateString) => {
    return exerciseDays[dateString] === true
  }

  const formatDateString = (month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const hasNote = (dateString) => {
    return dayNotes && dayNotes[dateString]
  }

  const handleLongPressStart = (dateString, event) => {
    event.preventDefault()
    setLongPressActive(true)
    longPressTimer.current = setTimeout(() => {
      openNoteModal(dateString)
      setLongPressActive(false)
    }, 500)
  }

  const handleLongPressEnd = (dateString, event) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!longPressActive) {
      return
    }

    setLongPressActive(false)
    toggleExerciseDay(dateString)
  }

  const openNoteModal = (dateString) => {
    const note = getDayNote(dateString)
    setNoteModal({ show: true, date: dateString, note })
  }

  const closeNoteModal = () => {
    setNoteModal({ show: false, date: '', note: '' })
  }

  const saveNote = () => {
    setDayNote(noteModal.date, noteModal.note)
    closeNoteModal()
  }

  const handleMonthClick = (monthIndex) => {
    if (viewMode === 'year') {
      // Switch to month view for this month
      setViewMode('month')
      setFocusedMonth(monthIndex)
      setMonthStates({ [monthIndex]: true })
      onFocusedMonthChange(monthIndex)
    }
  }

  const toggleYearView = () => {
    if (viewMode === 'month') {
      setViewMode('year')
      setFocusedMonth(null)
      setMonthStates({})
      onFocusedMonthChange(null)
    } else {
      setViewMode('month')
      const currentMonth = new Date().getMonth()
      setFocusedMonth(currentMonth)
      setMonthStates({ [currentMonth]: true })
      onFocusedMonthChange(currentMonth)
    }
  }

  const changeMonth = (delta) => {
    if (viewMode === 'month') {
      const newMonth = focusedMonth + delta
      if (newMonth < 0) {
        // Go to previous year
        const newDate = new Date(year - 1, 11, 1)
        setCurrentDate(newDate)
        setFocusedMonth(11)
        setMonthStates({ 11: true })
        onFocusedMonthChange(11)
      } else if (newMonth > 11) {
        // Go to next year
        const newDate = new Date(year + 1, 0, 1)
        setCurrentDate(newDate)
        setFocusedMonth(0)
        setMonthStates({ 0: true })
        onFocusedMonthChange(0)
      } else {
        setFocusedMonth(newMonth)
        setMonthStates({ [newMonth]: true })
        onFocusedMonthChange(newMonth)
      }
    }
  }

  const changeYear = (delta) => {
    const newDate = new Date(year + delta, 0, 1)
    setCurrentDate(newDate)
    if (viewMode === 'month') {
      // Keep the same month index when changing years
      setMonthStates({ [focusedMonth]: true })
    }
  }

  // Calculate transform for zoom
  const getTransform = () => {
    if (viewMode === 'year') {
      // Year view - no transform
      return { transform: 'scale(1) translate(0, 0)', pointerEvents: 'auto' }
    }

    // Month view - zoom in on specific month
    // Grid is 4 columns × 3 rows
    const col = focusedMonth % 4
    const row = Math.floor(focusedMonth / 4)

    // Each month occupies 25% width and 33.33% height of grid
    // Month center is at: (col * 25% + 12.5%, row * 33.33% + 16.67%)
    // We want to move this center to viewport center (50%, 50%)

    // Using scale(3), so we need to account for scaling in translate
    // Translate is applied in pre-scale space, so divide by scale factor
    const scale = 3

    // Calculate offset needed to center the month
    const monthCenterX = col * 25 + 12.5 // Month center X in %
    const monthCenterY = row * 33.33 + 16.67 // Month center Y in %

    // Translate needed to move month center to viewport center (50%, 50%)
    const translateX = (50 - monthCenterX * scale) / scale
    const translateY = (50 - monthCenterY * scale) / scale

    return {
      transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
      pointerEvents: 'none'
    }
  }

  const renderMonth = (monthIndex) => {
    const daysInMonth = getDaysInMonth(monthIndex)
    const firstDay = getFirstDayOfMonth(monthIndex)
    const days = []
    const isZoomedIn = viewMode === 'month' && focusedMonth === monthIndex
    const isMonthActive = monthStates[monthIndex] === true
    const shouldBeVisible = viewMode === 'year' || isMonthActive
    const canInteract = isZoomedIn && isMonthActive

    // Standard grid: 7 columns × 6 rows = 42 cells
    const totalCells = 42
    let cellIndex = 0

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-start-${i}`} className="calendar-day empty"></div>)
      cellIndex++
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(monthIndex, day)
      const isExercised = isExerciseDay(dateString)
      const isToday = year === todayDate.getFullYear() && monthIndex === todayDate.getMonth() && day === todayDate.getDate()

      days.push(
        <div
          key={day}
          className={`calendar-day ${isExercised ? 'exercised' : ''} ${isToday ? 'today' : ''} ${hasNote(dateString) ? 'has-note' : ''}`}
          onMouseDown={canInteract ? (e) => handleLongPressStart(dateString, e) : undefined}
          onMouseUp={canInteract ? (e) => handleLongPressEnd(dateString, e) : undefined}
          onMouseLeave={canInteract ? () => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current)
              longPressTimer.current = null
              setLongPressActive(false)
            }
          } : undefined}
          onTouchStart={canInteract ? (e) => handleLongPressStart(dateString, e) : undefined}
          onTouchEnd={canInteract ? (e) => handleLongPressEnd(dateString, e) : undefined}
          style={{
            color: isExercised ? '#fff' : theme.text,
            '--accent-color': theme.accent
          }}
        >
          {day}
          {isZoomedIn && hasNote(dateString) && <span className="note-indicator">📝</span>}
        </div>
      )
      cellIndex++
    }

    // Fill remaining cells to complete 6 rows (42 total cells)
    while (cellIndex < totalCells) {
      days.push(<div key={`empty-end-${cellIndex}`} className="calendar-day empty"></div>)
      cellIndex++
    }

    return (
      <div
        key={monthIndex}
        className={`month-card ${viewMode === 'year' ? 'clickable' : ''}`}
        onClick={() => handleMonthClick(monthIndex)}
        style={{
          opacity: shouldBeVisible ? 1 : 0,
          visibility: shouldBeVisible ? 'visible' : 'hidden',
          pointerEvents: (viewMode === 'year' || isMonthActive) ? 'auto' : 'none',
          transition: 'opacity 0.3s ease, visibility 0.3s ease'
        }}
      >
        <div className="month-header" style={{ color: theme.text }}>
          {monthIndex + 1}월
        </div>
        <div className="month-grid">
          {days}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-wrapper">
      {/* Navigation */}
      {viewMode === 'year' ? (
        <div className="year-nav">
          <button
            className="nav-button"
            onClick={() => changeYear(-1)}
            style={{ color: theme.text, backgroundColor: theme.card }}
          >
            ◀
          </button>
          <h2 style={{ color: theme.text }}>{year}년</h2>
          <button
            className="nav-button"
            onClick={() => changeYear(1)}
            style={{ color: theme.text, backgroundColor: theme.card }}
          >
            ▶
          </button>
        </div>
      ) : (
        <div className="month-nav-container">
          <button
            className="year-view-button"
            onClick={toggleYearView}
            style={{
              backgroundColor: theme.card,
              color: theme.text,
              border: `2px solid ${theme.accent}`
            }}
          >
            연간 보기
          </button>
          <div className="year-nav">
            <button
              className="nav-button"
              onClick={() => changeMonth(-1)}
              style={{ color: theme.text, backgroundColor: theme.card }}
            >
              ◀
            </button>
            <h2 style={{ color: theme.text }}>{year}년 {focusedMonth + 1}월</h2>
            <button
              className="nav-button"
              onClick={() => changeMonth(1)}
              style={{ color: theme.text, backgroundColor: theme.card }}
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {/* All 12 months grid */}
      <div
        ref={gridRef}
        className="all-months-grid"
        style={getTransform()}
      >
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>

      {/* Note Modal */}
      {noteModal.show && (
        <div className="note-modal-overlay" onClick={closeNoteModal}>
          <div
            className="note-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.card,
              color: theme.text,
              border: `2px solid ${theme.accent}`
            }}
          >
            <h3 style={{ color: theme.text }}>메모 추가</h3>
            <p style={{ color: theme.text, opacity: 0.8, fontSize: '0.9rem' }}>
              {noteModal.date}
            </p>
            <textarea
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
              placeholder="운동 메모를 입력하세요..."
              className="note-textarea"
              style={{
                backgroundColor: theme.background,
                color: theme.text,
                border: `1px solid ${theme.text}33`
              }}
              autoFocus
            />
            <div className="note-modal-buttons">
              <button
                onClick={saveNote}
                className="note-button save"
                style={{
                  backgroundColor: theme.accent,
                  color: '#fff'
                }}
              >
                저장
              </button>
              <button
                onClick={closeNoteModal}
                className="note-button cancel"
                style={{
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `2px solid ${theme.accent}`
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
