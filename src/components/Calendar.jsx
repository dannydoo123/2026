import { useContext, useState, useRef } from 'react'
import { ThemeContext } from '../App'
import './Calendar.css'

function Calendar({ currentDate, setCurrentDate, exerciseDays, toggleExerciseDay, viewMode, onMonthClick, dayNotes, setDayNote, getDayNote }) {
  const { theme } = useContext(ThemeContext)
  const [noteModal, setNoteModal] = useState({ show: false, date: '', note: '' })
  const longPressTimer = useRef(null)
  const [longPressActive, setLongPressActive] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState(null)
  const containerRef = useRef(null)

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentDate(newDate)
  }

  const isExerciseDay = (dateString) => {
    return exerciseDays[dateString] === true
  }

  const formatDateString = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const handleLongPressStart = (dateString, event) => {
    event.preventDefault()
    setLongPressActive(true)
    longPressTimer.current = setTimeout(() => {
      openNoteModal(dateString)
      setLongPressActive(false)
    }, 500) // 500ms for long press
  }

  const handleLongPressEnd = (dateString, event) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!longPressActive) {
      // This was a long press, don't toggle
      return
    }

    // This was a normal click
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

  const hasNote = (dateString) => {
    return dayNotes && dayNotes[dateString]
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDateString(year, month, day)
      const isExercised = isExerciseDay(dateString)
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

      days.push(
        <div
          key={day}
          className={`calendar-day ${isExercised ? 'exercised' : ''} ${isToday ? 'today' : ''} ${hasNote(dateString) ? 'has-note' : ''}`}
          onMouseDown={(e) => handleLongPressStart(dateString, e)}
          onMouseUp={(e) => handleLongPressEnd(dateString, e)}
          onMouseLeave={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current)
              longPressTimer.current = null
              setLongPressActive(false)
            }
          }}
          onTouchStart={(e) => handleLongPressStart(dateString, e)}
          onTouchEnd={(e) => handleLongPressEnd(dateString, e)}
          style={{
            backgroundColor: isExercised ? '#4caf50' : theme.card,
            color: isExercised ? '#fff' : theme.text,
            border: isToday ? `3px solid ${theme.accent}` : `1px solid ${theme.text}33`,
            '--accent-color': theme.accent
          }}
        >
          {day}
          {hasNote(dateString) && <span className="note-indicator">📝</span>}
        </div>
      )
    }

    return days
  }

  const handleMonthClickWithZoom = (month, event) => {
    // Capture the position of the clicked month card
    const clickedElement = event.currentTarget
    const rect = clickedElement.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()

    if (containerRect) {
      const originX = ((rect.left + rect.width / 2) - containerRect.left) / containerRect.width
      const originY = ((rect.top + rect.height / 2) - containerRect.top) / containerRect.height

      setZoomOrigin({ x: originX * 100, y: originY * 100 })
    }

    // Switch to month view
    onMonthClick(month)
  }

  const renderYearView = () => {
    const year = currentDate.getFullYear()
    const months = []

    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1)
      const daysInMonth = getDaysInMonth(monthDate)
      const firstDay = getFirstDayOfMonth(monthDate)
      const monthDays = []

      // Empty cells
      for (let i = 0; i < firstDay; i++) {
        monthDays.push(<div key={`empty-${i}`} className="mini-day empty"></div>)
      }

      // Days
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = formatDateString(year, month, day)
        const isExercised = isExerciseDay(dateString)

        monthDays.push(
          <div
            key={day}
            className={`mini-day ${isExercised ? 'exercised' : ''}`}
            style={{
              backgroundColor: isExercised ? '#4caf50' : theme.card,
              border: `1px solid ${theme.text}22`
            }}
          ></div>
        )
      }

      months.push(
        <div
          key={month}
          className="mini-month"
          style={{ backgroundColor: theme.card }}
          onClick={(e) => handleMonthClickWithZoom(month, e)}
        >
          <div className="mini-month-header" style={{ color: theme.text }}>
            {month + 1}월
          </div>
          <div className="mini-month-grid">
            {monthDays}
          </div>
        </div>
      )
    }

    return months
  }

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

  return (
    <div
      ref={containerRef}
      className={`calendar-container ${viewMode}`}
      style={{
        '--zoom-x': zoomOrigin ? `${zoomOrigin.x}%` : '50%',
        '--zoom-y': zoomOrigin ? `${zoomOrigin.y}%` : '50%'
      }}
    >
      {viewMode === 'month' ? (
        <>
          <div className="calendar-header">
            <button
              className="nav-button"
              onClick={() => changeMonth(-1)}
              style={{ color: theme.text, backgroundColor: theme.card }}
            >
              ◀
            </button>
            <h2 style={{ color: theme.text }}>
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </h2>
            <button
              className="nav-button"
              onClick={() => changeMonth(1)}
              style={{ color: theme.text, backgroundColor: theme.card }}
            >
              ▶
            </button>
          </div>

          <div className="calendar-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="weekday" style={{ color: theme.text }}>
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {renderMonthView()}
          </div>
        </>
      ) : (
        <>
          <div className="year-header" style={{ color: theme.text }}>
            <button
              className="nav-button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, 0, 1))}
              style={{ color: theme.text, backgroundColor: theme.card }}
            >
              ◀
            </button>
            <h2>{currentDate.getFullYear()}년</h2>
            <button
              className="nav-button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, 0, 1))}
              style={{ color: theme.text, backgroundColor: theme.card }}
            >
              ▶
            </button>
          </div>
          <div className="year-grid">
            {renderYearView()}
          </div>
        </>
      )}

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
