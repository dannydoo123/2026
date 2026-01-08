import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import {
  getDopamineCategories,
  createDopamineCategory,
  updateDopamineCategory,
  deleteDopamineCategory,
  getDopamineEntries,
  upsertDopamineEntry,
  deleteDopamineEntry
} from '../lib/database'
import { formatLocalDate, getTodayLocal, parseLocalDate, isToday as isTodayHelper } from '../utils/dateHelpers'
import './Dopamine.css'

function Dopamine() {
  const { theme } = useContext(ThemeContext)
  const { user } = useAuth()
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todayDate, setTodayDate] = useState(getTodayLocal())
  const [viewMode, setViewMode] = useState('month') // 'month' or 'year'
  const [showEntryModal, setShowEntryModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [entryValue, setEntryValue] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [timeValue, setTimeValue] = useState('')
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'count',
    unit: 'times',
    color: '#FF6B6B',
    goalType: 'none',
    goalValue: ''
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Update today's date in real-time
  useEffect(() => {
    const updateToday = () => {
      setTodayDate(getTodayLocal())
    }

    // Calculate milliseconds until next midnight (local time)
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

  // Load categories and entries from Supabase
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)
        const categoriesData = await getDopamineCategories()

        // Transform to match existing structure
        const categoriesObj = {}
        for (const cat of categoriesData) {
          const entries = await getDopamineEntries(cat.id)
          const entriesObj = {}
          entries.forEach(entry => {
            entriesObj[entry.date] = entry.value
          })

          categoriesObj[cat.id] = {
            name: cat.name,
            type: cat.type,
            unit: cat.unit,
            color: cat.color,
            goalType: cat.goal_type,
            goalValue: cat.goal_value,
            entries: entriesObj
          }
        }

        setCategories(categoriesObj)
        setLoading(false)
      } catch (error) {
        console.error('Error loading dopamine data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  useEffect(() => {
    const categoryIds = Object.keys(categories)
    if (categoryIds.length > 0 && !activeCategory) {
      setActiveCategory(categoryIds[0])
    }
  }, [categories, activeCategory])

  const getDaysInMonth = (m) => {
    return new Date(year, m + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (m) => {
    return new Date(year, m, 1).getDay()
  }

  const changeMonth = (delta) => {
    const newDate = new Date(year, month + delta, 1)
    setCurrentDate(newDate)
  }

  const changeYear = (delta) => {
    const newDate = new Date(year + delta, month, 1)
    setCurrentDate(newDate)
  }

  const toggleYearView = () => {
    setViewMode(viewMode === 'month' ? 'year' : 'month')
  }

  const selectMonth = (monthIndex) => {
    if (viewMode === 'year') {
      const newDate = new Date(year, monthIndex, 1)
      setCurrentDate(newDate)
      setViewMode('month')
    }
  }

  const getTransform = () => {
    if (viewMode === 'year') {
      return { transform: 'scale(1) translate(0, 0)', pointerEvents: 'auto' }
    }

    // Month view - zoom into specific month
    const col = month % 4
    const row = Math.floor(month / 4)
    const scale = 3

    const monthCenterX = col * 25 + 12.5
    const monthCenterY = row * 33.33 + 16.67

    const translateX = (50 - monthCenterX * scale) / scale
    const translateY = (50 - monthCenterY * scale) / scale

    return {
      transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
      pointerEvents: 'none'
    }
  }

  const openAddCategoryModal = () => {
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      type: 'count',
      unit: 'times',
      color: '#FF6B6B',
      goalType: 'none',
      goalValue: ''
    })
    setShowCategoryModal(true)
  }

  const openEditCategoryModal = (catId) => {
    const cat = categories[catId]
    setEditingCategory(catId)
    setCategoryForm({
      name: cat.name,
      type: cat.type,
      unit: cat.unit,
      color: cat.color,
      goalType: cat.goalType,
      goalValue: cat.goalValue || ''
    })
    setShowCategoryModal(true)
  }

  const closeCategoryModal = () => {
    setShowCategoryModal(false)
    setEditingCategory(null)
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('Please enter a category name')
      return
    }

    if (categoryForm.goalType === 'limit' && (!categoryForm.goalValue || parseFloat(categoryForm.goalValue) <= 0)) {
      alert('Please enter a valid goal limit')
      return
    }

    try {
      const categoryData = {
        name: categoryForm.name.trim(),
        type: categoryForm.type,
        unit: categoryForm.unit,
        color: categoryForm.color,
        goalType: categoryForm.goalType,
        goalValue: categoryForm.goalType === 'limit' ? parseFloat(categoryForm.goalValue) : 0
      }

      if (editingCategory) {
        await updateDopamineCategory(editingCategory, categoryData)
        setCategories(prev => ({
          ...prev,
          [editingCategory]: {
            ...categoryData,
            entries: prev[editingCategory].entries
          }
        }))
      } else {
        const newCategory = await createDopamineCategory(categoryData)
        setCategories(prev => ({
          ...prev,
          [newCategory.id]: {
            ...categoryData,
            entries: {}
          }
        }))
        setActiveCategory(newCategory.id)
      }

      closeCategoryModal()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Failed to save category')
    }
  }

  const deleteCategory = async (catId) => {
    if (window.confirm(`Delete category "${categories[catId].name}"?`)) {
      try {
        await deleteDopamineCategory(catId)
        const newCategories = { ...categories }
        delete newCategories[catId]
        setCategories(newCategories)

        if (activeCategory === catId) {
          const remaining = Object.keys(newCategories)
          setActiveCategory(remaining.length > 0 ? remaining[0] : null)
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        alert('Failed to delete category')
      }
    }
  }

  const openEntryModal = (dateString) => {
    if (!activeCategory) return

    setSelectedDate(dateString)
    const currentEntry = categories[activeCategory].entries[dateString] || 0

    if (categories[activeCategory].type === 'duration') {
      const hours = Math.floor(currentEntry / 60)
      const minutes = currentEntry % 60
      setDurationHours(hours.toString())
      setDurationMinutes(minutes.toString())
    } else if (categories[activeCategory].type === 'time') {
      // Convert stored minutes since midnight to HH:MM format
      if (currentEntry > 0) {
        const hours = Math.floor(currentEntry / 60)
        const minutes = currentEntry % 60
        setTimeValue(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
      } else {
        setTimeValue('')
      }
    } else {
      setEntryValue(currentEntry.toString())
    }

    setShowEntryModal(true)
  }

  const closeEntryModal = () => {
    setShowEntryModal(false)
    setEntryValue('')
    setDurationHours('')
    setDurationMinutes('')
    setTimeValue('')
  }

  const saveEntry = async () => {
    if (!activeCategory) return

    const cat = categories[activeCategory]
    let value = 0

    if (cat.type === 'duration') {
      const hours = parseInt(durationHours) || 0
      const minutes = parseInt(durationMinutes) || 0
      value = hours * 60 + minutes
    } else if (cat.type === 'time') {
      // Convert HH:MM to minutes since midnight
      if (timeValue) {
        const [hours, minutes] = timeValue.split(':').map(Number)
        value = hours * 60 + minutes
      }
    } else {
      value = parseFloat(entryValue) || 0
    }

    try {
      await upsertDopamineEntry(activeCategory, selectedDate, value)
      setCategories(prev => ({
        ...prev,
        [activeCategory]: {
          ...prev[activeCategory],
          entries: {
            ...prev[activeCategory].entries,
            [selectedDate]: value
          }
        }
      }))
      closeEntryModal()
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Failed to save entry')
    }
  }

  const deleteEntry = async () => {
    if (!activeCategory) return

    try {
      await deleteDopamineEntry(activeCategory, selectedDate)
      const newEntries = { ...categories[activeCategory].entries }
      delete newEntries[selectedDate]

      setCategories(prev => ({
        ...prev,
        [activeCategory]: {
          ...prev[activeCategory],
          entries: newEntries
        }
      }))

      closeEntryModal()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry')
    }
  }

  const getHeatMapIntensity = (dateString) => {
    if (!activeCategory) return 0

    const cat = categories[activeCategory]
    const value = cat.entries[dateString] || 0

    if (value === 0) return 0

    if (cat.type === 'time') {
      // For time tracking, later is better
      // Use noon (720 minutes) as the baseline
      // Earlier times have higher intensity (red), later times have lower intensity (green)
      const noon = 720 // 12:00 PM in minutes
      if (value <= noon) {
        // Morning: map 0-720 to 1.0-0.3 intensity
        return 1.0 - (value / noon) * 0.7
      } else {
        // Afternoon/Evening: map 720-1440 to 0.3-0.0 intensity
        return Math.max(0, 0.3 - ((value - noon) / noon) * 0.3)
      }
    }

    if (cat.goalType === 'abstinence') {
      return value > 0 ? 1 : 0
    } else if (cat.goalType === 'limit') {
      const ratio = value / cat.goalValue
      return Math.min(ratio, 1)
    } else {
      // For 'none', use a reasonable max for visualization
      const maxForVisualization = cat.type === 'duration' ? 240 : 20 // 4 hours or 20 counts
      return Math.min(value / maxForVisualization, 1)
    }
  }

  const isOnTrack = (dateString) => {
    if (!activeCategory) return true

    const cat = categories[activeCategory]
    const value = cat.entries[dateString] || 0

    if (cat.goalType === 'abstinence') {
      return value === 0
    } else if (cat.goalType === 'limit') {
      return value <= cat.goalValue
    }
    return true
  }

  const getCurrentStreak = () => {
    if (!activeCategory) return 0

    const cat = categories[activeCategory]
    if (cat.goalType !== 'abstinence') return null

    let streak = 0
    const today = new Date()

    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = formatLocalDate(date)

      if (cat.entries[dateString] && cat.entries[dateString] > 0) {
        break
      }
      streak++
    }

    return streak
  }

  const getWeeklyAverage = () => {
    if (!activeCategory) return 0

    const cat = categories[activeCategory]
    const today = new Date()
    let total = 0
    let days = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = formatLocalDate(date)

      if (cat.entries[dateString]) {
        total += cat.entries[dateString]
        days++
      }
    }

    return days > 0 ? total / days : 0
  }

  const getMonthlyAverage = () => {
    if (!activeCategory) return 0

    const cat = categories[activeCategory]
    const monthEntries = Object.entries(cat.entries)
      .filter(([dateString]) => {
        const date = parseLocalDate(dateString)
        return date.getFullYear() === year && date.getMonth() === month
      })

    if (monthEntries.length === 0) return 0

    const total = monthEntries.reduce((sum, [, value]) => sum + value, 0)
    return total / monthEntries.length
  }

  const getMonthlyTotal = () => {
    if (!activeCategory) return 0

    const cat = categories[activeCategory]
    const monthEntries = Object.entries(cat.entries)
      .filter(([dateString]) => {
        const date = parseLocalDate(dateString)
        return date.getFullYear() === year && date.getMonth() === month
      })

    return monthEntries.reduce((sum, [, value]) => sum + value, 0)
  }

  const getLastMonthComparison = () => {
    if (!activeCategory) return { difference: 0, percentage: 0, isImprovement: false }

    const cat = categories[activeCategory]

    // Current month total
    const currentMonthTotal = getMonthlyTotal()

    // Last month total
    const lastMonthDate = new Date(year, month - 1, 1)
    const lastMonthEntries = Object.entries(cat.entries)
      .filter(([dateString]) => {
        const date = parseLocalDate(dateString)
        return date.getFullYear() === lastMonthDate.getFullYear() &&
               date.getMonth() === lastMonthDate.getMonth()
      })

    const lastMonthTotal = lastMonthEntries.reduce((sum, [, value]) => sum + value, 0)

    if (lastMonthTotal === 0) return { difference: 0, percentage: 0, isImprovement: false }

    const difference = currentMonthTotal - lastMonthTotal
    const percentage = ((difference / lastMonthTotal) * 100)

    // For habits, lower is better (improvement = negative change)
    // For abstinence/limit goals, reduction is good
    const isImprovement = cat.goalType === 'none' ? false : difference < 0

    return { difference, percentage, isImprovement }
  }

  const formatDuration = (value) => {
    const hours = Math.floor(value / 60)
    const minutes = value % 60
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
  }

  const formatValue = (value) => {
    if (!activeCategory) return '0'

    const cat = categories[activeCategory]

    if (cat.type === 'duration') {
      const hours = Math.floor(value / 60)
      const minutes = value % 60
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
      if (hours > 0) return `${hours}h`
      return `${minutes}m`
    }

    if (cat.type === 'time') {
      if (value === 0) return 'Not set'
      const hours = Math.floor(value / 60)
      const minutes = value % 60
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
    }

    return `${value.toFixed(1)} ${cat.unit}`
  }

  const renderMonthGrid = (monthIndex) => {
    if (!activeCategory) return null

    const cat = categories[activeCategory]
    const daysInMonth = getDaysInMonth(monthIndex)
    const firstDay = getFirstDayOfMonth(monthIndex)
    const days = []
    const totalCells = 42
    let cellIndex = 0

    const isMonthActive = monthIndex === month
    const canInteract = viewMode === 'month' && isMonthActive

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-start-${i}`} className="dopamine-calendar-day-small empty"></div>)
      cellIndex++
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const intensity = getHeatMapIntensity(dateString)
      const value = cat.entries[dateString] || 0
      const isToday = isTodayHelper(dateString)
      const hasEntry = value > 0

      days.push(
        <div
          key={day}
          className={`dopamine-calendar-day-small ${isToday ? 'today' : ''}`}
          onClick={canInteract ? (e) => {
            e.stopPropagation()
            openEntryModal(dateString)
          } : undefined}
          style={{
            color: theme.text,
            backgroundColor: hasEntry
              ? `rgba(255, 100, 100, ${intensity * 0.6})`
              : 'transparent',
            cursor: canInteract ? 'pointer' : 'default'
          }}
        >
          <span className="day-number-small">{day}</span>
          {canInteract && hasEntry && (
            <span className="track-indicator" style={{ fontSize: '0.5rem', marginTop: '2px' }}>
              {cat.type === 'duration' ? formatDuration(value) :
               cat.type === 'time' ? formatValue(value).replace(' ', '') :
               value}
            </span>
          )}
        </div>
      )
      cellIndex++
    }

    // Fill remaining
    while (cellIndex < totalCells) {
      days.push(<div key={`empty-end-${cellIndex}`} className="dopamine-calendar-day-small empty"></div>)
      cellIndex++
    }

    return days
  }

  const renderCalendar = () => {
    if (!activeCategory) return null

    const cat = categories[activeCategory]
    const daysInMonth = getDaysInMonth(month)
    const firstDay = getFirstDayOfMonth(month)
    const days = []
    const totalCells = 42
    let cellIndex = 0

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-start-${i}`} className="dopamine-calendar-day empty"></div>)
      cellIndex++
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const intensity = getHeatMapIntensity(dateString)
      const onTrack = isOnTrack(dateString)
      const value = cat.entries[dateString] || 0
      const isToday = isTodayHelper(dateString)
      const hasEntry = value > 0

      days.push(
        <div
          key={day}
          className={`dopamine-calendar-day ${isToday ? 'today' : ''} ${hasEntry ? 'has-entry' : ''}`}
          onClick={() => openEntryModal(dateString)}
          style={{
            color: theme.text,
            backgroundColor: hasEntry
              ? `rgba(255, 100, 100, ${intensity * 0.6})`
              : 'transparent'
          }}
        >
          <span className="day-number">{day}</span>
          {hasEntry && cat.goalType !== 'none' && (
            <span className="track-indicator">
              {onTrack ? '✅' : '⚠️'}
            </span>
          )}
        </div>
      )
      cellIndex++
    }

    // Fill remaining
    while (cellIndex < totalCells) {
      days.push(<div key={`empty-end-${cellIndex}`} className="dopamine-calendar-day empty"></div>)
      cellIndex++
    }

    return days
  }

  const renderAllMonths = () => {
    if (!activeCategory) return null

    const cat = categories[activeCategory]

    return Array.from({ length: 12 }, (_, i) => {
      const isCurrentMonth = i === month
      const shouldBeVisible = viewMode === 'year' || isCurrentMonth

      return (
        <div
          key={i}
          className={`dopamine-month-card ${viewMode === 'year' ? 'clickable' : ''}`}
          onClick={viewMode === 'year' ? () => selectMonth(i) : undefined}
          style={{
            backgroundColor: theme.card,
            opacity: shouldBeVisible ? 1 : 0,
            visibility: shouldBeVisible ? 'visible' : 'hidden',
            pointerEvents: shouldBeVisible ? 'auto' : 'none',
            transition: 'opacity 0.3s ease, visibility 0.3s ease'
          }}
        >
          <div className="dopamine-month-header" style={{ color: theme.text }}>
            {i + 1}월
          </div>
          <div className="dopamine-month-grid-small">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="weekday-header-small" style={{ color: theme.text, opacity: 0.5 }}>
                {day}
              </div>
            ))}
            {renderMonthGrid(i)}
          </div>
        </div>
      )
    })
  }

  const renderTrendChart = () => {
    if (!activeCategory) return null

    const cat = categories[activeCategory]
    const days = []
    const today = new Date()

    // Get last 30 days of data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = formatLocalDate(date)
      const value = cat.entries[dateString] || 0

      days.push({
        date: date.getDate(),
        value,
        dateString
      })
    }

    const maxValue = Math.max(
      ...days.map(d => d.value),
      cat.goalType === 'limit' ? cat.goalValue : 0,
      1
    )

    // Calculate SVG path for line chart
    const chartWidth = 800
    const chartHeight = 200
    const padding = 20
    const plotWidth = chartWidth - (padding * 2)
    const plotHeight = chartHeight - (padding * 2)

    const points = days.map((day, index) => {
      const x = padding + (index / (days.length - 1)) * plotWidth
      const y = chartHeight - padding - (day.value / maxValue) * plotHeight
      return { x, y, value: day.value }
    })

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
      .join(' ')

    // Goal line path
    const goalY = cat.goalType === 'limit'
      ? chartHeight - padding - (cat.goalValue / maxValue) * plotHeight
      : null

    return (
      <div className="trend-chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart">
          {/* Goal line */}
          {goalY && (
            <line
              x1={padding}
              y1={goalY}
              x2={chartWidth - padding}
              y2={goalY}
              stroke={theme.accent}
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          )}

          {/* Data line */}
          <path
            d={pathData}
            fill="none"
            stroke={cat.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            point.value > 0 && (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={cat.color}
                stroke="#fff"
                strokeWidth="2"
              />
            )
          ))}

          {/* Y-axis labels */}
          <text x="5" y={padding} fill={theme.text} fontSize="12" opacity="0.6">
            {formatValue(maxValue)}
          </text>
          <text x="5" y={chartHeight - padding} fill={theme.text} fontSize="12" opacity="0.6">
            0
          </text>

          {/* X-axis labels (show every 5 days) */}
          {days.map((day, index) => (
            index % 5 === 0 && (
              <text
                key={index}
                x={padding + (index / (days.length - 1)) * plotWidth}
                y={chartHeight - 5}
                fill={theme.text}
                fontSize="11"
                opacity="0.6"
                textAnchor="middle"
              >
                {day.date}
              </text>
            )
          ))}
        </svg>
      </div>
    )
  }

  const activeCat = activeCategory ? categories[activeCategory] : null
  const streak = getCurrentStreak()
  const weeklyAvg = getWeeklyAverage()
  const monthlyAvg = getMonthlyAverage()
  const monthlyTotal = getMonthlyTotal()
  const comparison = getLastMonthComparison()

  if (loading) {
    return (
      <div className="dopamine-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: theme.text, fontSize: '24px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="dopamine-page">
      <h1 style={{ color: theme.text }}>도파민</h1>

      {/* Category Tabs */}
      <div className="category-tabs">
        {Object.entries(categories).map(([catId, cat]) => (
          <div
            key={catId}
            className={`category-tab ${activeCategory === catId ? 'active' : ''}`}
            onClick={() => setActiveCategory(catId)}
            style={{
              backgroundColor: activeCategory === catId ? cat.color : theme.card,
              color: activeCategory === catId ? '#fff' : theme.text,
              borderBottom: activeCategory === catId ? `3px solid ${cat.color}` : 'none'
            }}
          >
            {cat.name}
            <button
              className="edit-category-btn"
              onClick={(e) => {
                e.stopPropagation()
                openEditCategoryModal(catId)
              }}
              style={{ color: activeCategory === catId ? '#fff' : theme.text }}
            >
              ⚙️
            </button>
          </div>
        ))}
        <button
          className="add-category-tab"
          onClick={openAddCategoryModal}
          style={{ backgroundColor: theme.card, color: theme.accent }}
        >
          + Add Category
        </button>
      </div>

      {!activeCategory ? (
        <div className="empty-state" style={{ color: theme.text }}>
          Create a category to start tracking your habits
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="summary-card" style={{ backgroundColor: theme.card }}>
            {activeCat.goalType === 'abstinence' && (
              <div className="summary-item">
                <span style={{ color: theme.text, opacity: 0.8 }}>Current Streak</span>
                <span className="streak-value" style={{ color: activeCat.color }}>
                  {streak} days
                </span>
              </div>
            )}
            <div className="summary-item">
              <span style={{ color: theme.text, opacity: 0.8 }}>This Month Total</span>
              <span style={{ color: theme.text, fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatValue(monthlyTotal)}
              </span>
            </div>
            <div className="summary-item">
              <span style={{ color: theme.text, opacity: 0.8 }}>Monthly Avg</span>
              <span style={{ color: theme.text, fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatValue(monthlyAvg)}
              </span>
            </div>
            {comparison.percentage !== 0 && (
              <div className="summary-item">
                <span style={{ color: theme.text, opacity: 0.8 }}>vs Last Month</span>
                <span
                  style={{
                    color: comparison.isImprovement ? '#06D6A0' : '#FF6B6B',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {comparison.isImprovement ? '↓' : '↑'} {Math.abs(comparison.percentage).toFixed(1)}%
                </span>
              </div>
            )}
            {activeCat.goalType === 'limit' && (
              <div className="summary-item">
                <span style={{ color: theme.text, opacity: 0.8 }}>Daily Goal</span>
                <span style={{ color: theme.accent, fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {formatValue(activeCat.goalValue)}
                </span>
              </div>
            )}
          </div>

          {/* Calendar */}
          <div className="dopamine-calendar-wrapper-zoom">
            {viewMode === 'month' ? (
              <div className="dopamine-month-nav-container">
                <button
                  className="dopamine-year-view-button"
                  onClick={toggleYearView}
                  style={{
                    backgroundColor: theme.card,
                    color: theme.text,
                    border: `2px solid ${theme.accent}`
                  }}
                >
                  연간 보기
                </button>
                <div className="month-nav">
                  <button onClick={() => changeMonth(-1)} style={{ color: theme.text, backgroundColor: theme.card }}>◀</button>
                  <h2 style={{ color: theme.text }}>{year}년 {month + 1}월</h2>
                  <button onClick={() => changeMonth(1)} style={{ color: theme.text, backgroundColor: theme.card }}>▶</button>
                </div>
              </div>
            ) : (
              <div className="month-nav">
                <button onClick={() => changeYear(-1)} style={{ color: theme.text, backgroundColor: theme.card }}>◀</button>
                <h2 style={{ color: theme.text }}>{year}년</h2>
                <button onClick={() => changeYear(1)} style={{ color: theme.text, backgroundColor: theme.card }}>▶</button>
              </div>
            )}

            <div className="dopamine-year-grid-zoom" style={getTransform()}>
              {renderAllMonths()}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="trend-section" style={{ backgroundColor: theme.card }}>
            <h2 style={{ color: theme.text }}>Last 30 Days</h2>
            {renderTrendChart()}
          </div>
        </>
      )}

      {/* Entry Modal */}
      {showEntryModal && activeCat && (
        <div className="modal-overlay" onClick={closeEntryModal}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${activeCat.color}` }}
          >
            <h3>{activeCat.name} - {selectedDate}</h3>

            <div className="modal-field">
              <label>
                {activeCat.type === 'duration' ? 'Duration' : activeCat.type === 'time' ? 'Time' : 'Count'}
              </label>
              {activeCat.type === 'duration' ? (
                <div className="duration-inputs">
                  <input
                    type="number"
                    min="0"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="Hours"
                    style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${activeCat.color}` }}
                  />
                  <span style={{ color: theme.text }}>:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="Minutes"
                    style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${activeCat.color}` }}
                  />
                </div>
              ) : activeCat.type === 'time' ? (
                <input
                  type="time"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${activeCat.color}`, width: '100%', padding: '8px' }}
                />
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={entryValue}
                  onChange={(e) => setEntryValue(e.target.value)}
                  placeholder={`Enter ${activeCat.unit}`}
                  style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${activeCat.color}` }}
                />
              )}
            </div>

            <div className="modal-buttons">
              <button
                onClick={deleteEntry}
                className="delete-button"
                style={{ backgroundColor: '#FF6B6B', color: '#fff' }}
              >
                Delete
              </button>
              <button
                onClick={saveEntry}
                className="save-button"
                style={{ backgroundColor: activeCat.color, color: '#fff' }}
              >
                Save
              </button>
              <button
                onClick={closeEntryModal}
                className="cancel-button"
                style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${activeCat.color}` }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div
            className="modal category-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${theme.accent}` }}
          >
            <h3>{editingCategory ? 'Edit Category' : 'New Category'}</h3>

            <div className="modal-field">
              <label>Name</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Vaping, Screen Time"
                style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
              />
            </div>

            <div className="modal-field">
              <label>Tracking Type</label>
              <select
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value, unit: e.target.value === 'duration' ? 'minutes' : e.target.value === 'time' ? 'time' : 'times' })}
                style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
              >
                <option value="count">Count (number of times)</option>
                <option value="duration">Duration (time spent)</option>
                <option value="time">First consumption (Time)</option>
              </select>
            </div>

            {categoryForm.type === 'count' && (
              <div className="modal-field">
                <label>Unit</label>
                <input
                  type="text"
                  value={categoryForm.unit}
                  onChange={(e) => setCategoryForm({ ...categoryForm, unit: e.target.value })}
                  placeholder="e.g., cigarettes, drinks, times"
                  style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
                />
              </div>
            )}

            {categoryForm.type === 'time' && (
              <div className="modal-field">
                <label>Note</label>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '4px' }}>
                  Track the time of first consumption. Later times mean better progress!
                </p>
              </div>
            )}

            <div className="modal-field">
              <label>Color</label>
              <input
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                style={{ width: '100%', height: '50px', border: `1px solid ${theme.accent}`, cursor: 'pointer' }}
              />
            </div>

            <div className="modal-field">
              <label>Goal Type</label>
              <select
                value={categoryForm.goalType}
                onChange={(e) => setCategoryForm({ ...categoryForm, goalType: e.target.value })}
                style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
              >
                <option value="none">None (just tracking)</option>
                <option value="limit">Stay Under Limit</option>
                <option value="abstinence">Abstinence (zero tolerance)</option>
              </select>
            </div>

            {categoryForm.goalType === 'limit' && (
              <div className="modal-field">
                <label>Daily Limit</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={categoryForm.goalValue}
                  onChange={(e) => setCategoryForm({ ...categoryForm, goalValue: e.target.value })}
                  placeholder={categoryForm.type === 'duration' ? 'Minutes' : categoryForm.unit}
                  style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
                />
              </div>
            )}

            <div className="modal-buttons">
              {editingCategory && (
                <button
                  onClick={() => { deleteCategory(editingCategory); closeCategoryModal(); }}
                  className="delete-button"
                  style={{ backgroundColor: '#FF6B6B', color: '#fff' }}
                >
                  Delete
                </button>
              )}
              <button
                onClick={saveCategory}
                className="save-button"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                Save
              </button>
              <button
                onClick={closeCategoryModal}
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

export default Dopamine
