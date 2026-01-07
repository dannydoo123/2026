import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../App'
import { useAuth } from '../contexts/AuthContext'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction as dbDeleteTransaction,
  getRecurringTransactions,
  createRecurringTransaction,
  deleteRecurringTransaction
} from '../lib/database'
import './Money.css'

function Money() {
  const { theme } = useContext(ThemeContext)
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todayDate, setTodayDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' or 'year'
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [modalData, setModalData] = useState({
    type: 'expense',
    category: 'Food',
    amount: '',
    currency: 'USD',
    note: '',
    date: '',
    isRecurring: false,
    recurringDay: 1
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

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

  // Category definitions
  const categories = {
    expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
  }

  const categoryColors = {
    Food: '#FF6B6B',
    Transport: '#4ECDC4',
    Shopping: '#FFE66D',
    Bills: '#95E1D3',
    Entertainment: '#F38181',
    Health: '#AA96DA',
    Salary: '#06D6A0',
    Freelance: '#118AB2',
    Investment: '#073B4C',
    Gift: '#FFD166',
    Other: '#CCCCCC'
  }

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoading(true)
        const [transactionsData, recurringData] = await Promise.all([
          getTransactions(),
          getRecurringTransactions()
        ])

        setTransactions(transactionsData)
        setRecurringTransactions(recurringData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading money data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Apply recurring transactions for the current month
  useEffect(() => {
    if (loading || !user) return

    async function applyRecurring() {
      for (const recurring of recurringTransactions) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(recurring.recurring_day).padStart(2, '0')}`
        const exists = transactions.some(t =>
          t.date === dateString &&
          t.category === recurring.category &&
          t.type === recurring.type &&
          t.is_recurring
        )
        if (!exists) {
          try {
            const newTransaction = await createTransaction({
              type: recurring.type,
              category: recurring.category,
              amount: recurring.amount,
              currency: recurring.currency,
              note: recurring.note,
              date: dateString,
              isRecurring: true,
              recurringDay: recurring.recurring_day
            })
            setTransactions(prev => [...prev, newTransaction])
          } catch (error) {
            console.error('Error creating recurring transaction:', error)
          }
        }
      }
    }

    applyRecurring()
  }, [year, month, recurringTransactions, transactions, loading, user])

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
      return { transform: 'scale(1) translate(0, 0)' }
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
      transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`
    }
  }

  const openAddModal = (dateString = null) => {
    setEditingTransaction(null)
    setModalData({
      type: 'expense',
      category: 'Food',
      amount: '',
      currency: 'USD',
      note: '',
      date: dateString || `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
      isRecurring: false,
      recurringDay: 1
    })
    setShowModal(true)
  }

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction)
    setModalData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      currency: transaction.currency,
      note: transaction.note || '',
      date: transaction.date,
      isRecurring: transaction.isRecurring || false,
      recurringDay: transaction.recurringDay || 1
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTransaction(null)
  }

  const saveTransaction = async () => {
    if (!modalData.amount || parseFloat(modalData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      const transactionData = {
        type: modalData.type,
        category: modalData.category,
        amount: parseFloat(modalData.amount),
        currency: modalData.currency,
        note: modalData.note,
        date: modalData.date,
        isRecurring: modalData.isRecurring,
        recurringDay: modalData.isRecurring ? parseInt(modalData.recurringDay) : null
      }

      if (editingTransaction) {
        const updated = await updateTransaction(editingTransaction.id, transactionData)
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updated : t))

        if (updated.is_recurring) {
          const recurringData = {
            type: updated.type,
            category: updated.category,
            amount: updated.amount,
            currency: updated.currency,
            note: updated.note,
            recurringDay: updated.recurring_day
          }
          await createRecurringTransaction(recurringData)
          const recurringList = await getRecurringTransactions()
          setRecurringTransactions(recurringList)
        }
      } else {
        const created = await createTransaction(transactionData)
        setTransactions(prev => [...prev, created])

        if (created.is_recurring) {
          const recurringData = {
            type: created.type,
            category: created.category,
            amount: created.amount,
            currency: created.currency,
            note: created.note,
            recurringDay: created.recurring_day
          }
          await createRecurringTransaction(recurringData)
          const recurringList = await getRecurringTransactions()
          setRecurringTransactions(recurringList)
        }
      }

      closeModal()
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('Failed to save transaction')
    }
  }

  const deleteTransaction = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await dbDeleteTransaction(id)
        setTransactions(prev => prev.filter(t => t.id !== id))
      } catch (error) {
        console.error('Error deleting transaction:', error)
        alert('Failed to delete transaction')
      }
    }
  }

  const getTransactionsByDate = (dateString) => {
    return transactions.filter(t => t.date === dateString)
  }

  const getDayType = (dateString) => {
    const dayTransactions = getTransactionsByDate(dateString)
    if (dayTransactions.length === 0) return 'none'

    const hasIncome = dayTransactions.some(t => t.type === 'income')
    const hasExpense = dayTransactions.some(t => t.type === 'expense')

    if (hasIncome && hasExpense) return 'mixed'
    if (hasIncome) return 'income'
    return 'expense'
  }

  const getDayTotal = (dateString) => {
    const dayTransactions = getTransactionsByDate(dateString)
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.currency === 'USD' ? t.amount : t.amount / 1300), 0)
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.currency === 'USD' ? t.amount : t.amount / 1300), 0)
    return income - expense
  }

  const getMonthTransactions = () => {
    return transactions.filter(t => {
      const date = new Date(t.date)
      return date.getFullYear() === year && date.getMonth() === month
    })
  }

  const calculateNetIncome = () => {
    const monthTransactions = getMonthTransactions()
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.currency === 'USD' ? t.amount : t.amount / 1300), 0)
    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.currency === 'USD' ? t.amount : t.amount / 1300), 0)
    return { totalIncome, totalExpense, net: totalIncome - totalExpense }
  }

  const getCategoryBreakdown = () => {
    const monthTransactions = getMonthTransactions()
    const breakdown = {}

    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const amount = t.currency === 'USD' ? t.amount : t.amount / 1300
        breakdown[t.category] = (breakdown[t.category] || 0) + amount
      })

    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }

  const formatCurrency = (amount, currency = 'USD') => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`
    }
    return `₩${amount.toLocaleString('ko-KR')}`
  }

  const renderMonthGrid = (monthIndex) => {
    const daysInMonth = getDaysInMonth(monthIndex)
    const firstDay = getFirstDayOfMonth(monthIndex)
    const days = []
    const totalCells = 42
    let cellIndex = 0

    const isMonthActive = monthIndex === month
    const canInteract = viewMode === 'month' && isMonthActive

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-start-${i}`} className="money-calendar-day-small empty"></div>)
      cellIndex++
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayType = getDayType(dateString)
      const dayTotal = getDayTotal(dateString)
      const isToday = todayDate.toDateString() === new Date(dateString).toDateString()

      days.push(
        <div
          key={day}
          className={`money-calendar-day-small ${dayType} ${isToday ? 'today' : ''}`}
          onClick={canInteract ? (e) => {
            e.stopPropagation()
            openAddModal(dateString)
          } : undefined}
          style={{
            color: theme.text,
            cursor: canInteract ? 'pointer' : 'default'
          }}
        >
          <span className="day-number-small">{day}</span>
          {canInteract && dayType !== 'none' && (
            <span
              className="day-total"
              style={{
                color: dayTotal >= 0 ? '#06D6A0' : '#FF6B6B',
                fontSize: '0.5rem',
                marginTop: '2px'
              }}
            >
              {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
            </span>
          )}
        </div>
      )
      cellIndex++
    }

    // Fill remaining
    while (cellIndex < totalCells) {
      days.push(<div key={`empty-end-${cellIndex}`} className="money-calendar-day-small empty"></div>)
      cellIndex++
    }

    return days
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(month)
    const firstDay = getFirstDayOfMonth(month)
    const days = []
    const totalCells = 42
    let cellIndex = 0

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-start-${i}`} className="money-calendar-day empty"></div>)
      cellIndex++
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayType = getDayType(dateString)
      const dayTotal = getDayTotal(dateString)
      const isToday = todayDate.toDateString() === new Date(dateString).toDateString()

      days.push(
        <div
          key={day}
          className={`money-calendar-day ${dayType} ${isToday ? 'today' : ''}`}
          onClick={() => openAddModal(dateString)}
          style={{ color: theme.text }}
        >
          <span className="day-number">{day}</span>
          {dayType !== 'none' && (
            <span
              className="day-total"
              style={{ color: dayTotal >= 0 ? '#06D6A0' : '#FF6B6B' }}
            >
              {dayTotal >= 0 ? '+' : ''}{formatCurrency(dayTotal)}
            </span>
          )}
        </div>
      )
      cellIndex++
    }

    // Fill remaining
    while (cellIndex < totalCells) {
      days.push(<div key={`empty-end-${cellIndex}`} className="money-calendar-day empty"></div>)
      cellIndex++
    }

    return days
  }

  const renderAllMonths = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const isCurrentMonth = i === month
      const shouldBeVisible = viewMode === 'year' || isCurrentMonth

      return (
        <div
          key={i}
          className={`money-month-card ${viewMode === 'year' ? 'clickable' : ''}`}
          onClick={viewMode === 'year' ? () => selectMonth(i) : undefined}
          style={{
            backgroundColor: theme.card,
            opacity: shouldBeVisible ? 1 : 0,
            visibility: shouldBeVisible ? 'visible' : 'hidden',
            pointerEvents: shouldBeVisible ? 'auto' : 'none',
            transition: 'opacity 0.3s ease, visibility 0.3s ease'
          }}
        >
          <div className="money-month-header" style={{ color: theme.text }}>
            {i + 1}월
          </div>
          <div className="money-month-grid-small">
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

  const renderPieChart = () => {
    const breakdown = getCategoryBreakdown()
    if (breakdown.length === 0) return <div style={{ color: theme.text, opacity: 0.6 }}>No expenses this month</div>

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0)
    let currentAngle = 0

    return (
      <div className="pie-chart-container">
        <svg viewBox="0 0 200 200" className="pie-chart">
          {breakdown.map((item, index) => {
            const percentage = item.amount / total
            const angle = percentage * 360
            const startAngle = currentAngle
            currentAngle += angle

            const startX = 100 + 90 * Math.cos((startAngle - 90) * Math.PI / 180)
            const startY = 100 + 90 * Math.sin((startAngle - 90) * Math.PI / 180)
            const endX = 100 + 90 * Math.cos((startAngle + angle - 90) * Math.PI / 180)
            const endY = 100 + 90 * Math.sin((startAngle + angle - 90) * Math.PI / 180)
            const largeArc = angle > 180 ? 1 : 0

            return (
              <path
                key={index}
                d={`M 100 100 L ${startX} ${startY} A 90 90 0 ${largeArc} 1 ${endX} ${endY} Z`}
                fill={categoryColors[item.category]}
                stroke="#fff"
                strokeWidth="2"
              />
            )
          })}
        </svg>
        <div className="pie-chart-legend">
          {breakdown.map((item, index) => (
            <div key={index} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: categoryColors[item.category] }}></span>
              <span style={{ color: theme.text }}>{item.category}: ${item.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const { totalIncome, totalExpense, net } = calculateNetIncome()

  if (loading) {
    return (
      <div className="money-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: theme.text, fontSize: '24px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="money-page">
      <h1 style={{ color: theme.text }}>돈</h1>

      {/* Summary Card */}
      <div className="summary-card" style={{ backgroundColor: theme.card }}>
        <div className="summary-item">
          <span style={{ color: theme.text, opacity: 0.8 }}>Income</span>
          <span className="income-amount" style={{ color: '#06D6A0' }}>{formatCurrency(totalIncome)}</span>
        </div>
        <div className="summary-item">
          <span style={{ color: theme.text, opacity: 0.8 }}>Expenses</span>
          <span className="expense-amount" style={{ color: '#FF6B6B' }}>{formatCurrency(totalExpense)}</span>
        </div>
        <div className="summary-item net">
          <span style={{ color: theme.text, opacity: 0.8 }}>Net Income</span>
          <span className="net-amount" style={{ color: net >= 0 ? '#06D6A0' : '#FF6B6B' }}>
            {formatCurrency(net)}
          </span>
        </div>
      </div>

      {/* Calendar */}
      <div className="money-calendar-wrapper-zoom">
        {viewMode === 'month' ? (
          <div className="money-month-nav-container">
            <button
              className="money-year-view-button"
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

        <div className="money-year-grid-zoom" style={getTransform()}>
          {renderAllMonths()}
        </div>
      </div>

      {/* Main Content Area: Transaction List + Pie Chart */}
      <div className="content-grid">
        {/* Transaction List */}
        <div className="transaction-list-section">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: theme.text }}>Transactions</h2>
            <button
              className="add-button"
              onClick={() => openAddModal()}
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              + Add
            </button>
          </div>
          <div className="transaction-list">
            {getMonthTransactions().length === 0 ? (
              <div style={{ color: theme.text, opacity: 0.6, textAlign: 'center', padding: '20px' }}>
                No transactions this month
              </div>
            ) : (
              getMonthTransactions()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(transaction => (
                  <div
                    key={transaction.id}
                    className="transaction-item"
                    style={{ backgroundColor: theme.card, borderLeft: `4px solid ${categoryColors[transaction.category]}` }}
                    onClick={() => openEditModal(transaction)}
                  >
                    <div className="transaction-main">
                      <div className="transaction-info">
                        <span className="transaction-category" style={{ color: categoryColors[transaction.category] }}>
                          {transaction.category}
                        </span>
                        <span className="transaction-date" style={{ color: theme.text, opacity: 0.6 }}>
                          {new Date(transaction.date).toLocaleDateString('ko-KR')}
                          {transaction.isRecurring && ' 🔁'}
                        </span>
                      </div>
                      <span
                        className={`transaction-amount ${transaction.type}`}
                        style={{ color: transaction.type === 'income' ? '#06D6A0' : '#FF6B6B' }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                    </div>
                    {transaction.note && (
                      <div className="transaction-note" style={{ color: theme.text, opacity: 0.7 }}>
                        {transaction.note}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Pie Chart Section */}
        <div className="pie-chart-section" style={{ backgroundColor: theme.card }}>
          <h2 style={{ color: theme.text }}>Spending Breakdown</h2>
          {renderPieChart()}
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="transaction-modal-overlay" onClick={closeModal}>
          <div
            className="transaction-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: theme.card, color: theme.text, border: `2px solid ${theme.accent}` }}
          >
            <h3>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h3>

            <div className="modal-field">
              <label>Type</label>
              <div className="type-selector">
                <button
                  className={modalData.type === 'expense' ? 'active' : ''}
                  onClick={() => setModalData({ ...modalData, type: 'expense', category: 'Food' })}
                  style={{
                    backgroundColor: modalData.type === 'expense' ? '#FF6B6B' : theme.background,
                    color: modalData.type === 'expense' ? '#fff' : theme.text
                  }}
                >
                  Expense
                </button>
                <button
                  className={modalData.type === 'income' ? 'active' : ''}
                  onClick={() => setModalData({ ...modalData, type: 'income', category: 'Salary' })}
                  style={{
                    backgroundColor: modalData.type === 'income' ? '#06D6A0' : theme.background,
                    color: modalData.type === 'income' ? '#fff' : theme.text
                  }}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="modal-field">
              <label>Category</label>
              <select
                value={modalData.category}
                onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
              >
                {categories[modalData.type].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="modal-field">
              <label>Amount</label>
              <div className="amount-input-group">
                <input
                  type="number"
                  value={modalData.amount}
                  onChange={(e) => setModalData({ ...modalData, amount: e.target.value })}
                  placeholder="0.00"
                  style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
                />
                <select
                  value={modalData.currency}
                  onChange={(e) => setModalData({ ...modalData, currency: e.target.value })}
                  style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
                >
                  <option value="USD">$ USD</option>
                  <option value="KRW">₩ KRW</option>
                </select>
              </div>
            </div>

            <div className="modal-field">
              <label>Date</label>
              <input
                type="date"
                value={modalData.date}
                onChange={(e) => setModalData({ ...modalData, date: e.target.value })}
                style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
              />
            </div>

            <div className="modal-field">
              <label>Note (optional)</label>
              <textarea
                value={modalData.note}
                onChange={(e) => setModalData({ ...modalData, note: e.target.value })}
                placeholder="Add a note..."
                style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
              />
            </div>

            <div className="modal-field checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={modalData.isRecurring}
                  onChange={(e) => setModalData({ ...modalData, isRecurring: e.target.checked })}
                />
                <span style={{ color: theme.text }}>Recurring (monthly)</span>
              </label>
              {modalData.isRecurring && (
                <div className="recurring-day-selector">
                  <label>Day of month:</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={modalData.recurringDay}
                    onChange={(e) => setModalData({ ...modalData, recurringDay: e.target.value })}
                    style={{ backgroundColor: theme.background, color: theme.text, border: `1px solid ${theme.accent}` }}
                  />
                </div>
              )}
            </div>

            <div className="modal-buttons">
              {editingTransaction && (
                <button
                  onClick={() => { deleteTransaction(editingTransaction.id); closeModal(); }}
                  className="delete-button"
                  style={{ backgroundColor: '#FF6B6B', color: '#fff' }}
                >
                  Delete
                </button>
              )}
              <button
                onClick={saveTransaction}
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

export default Money
