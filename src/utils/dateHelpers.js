// Helper function to format date as YYYY-MM-DD in local timezone
// This prevents timezone offset issues when comparing dates
export function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get today's date as YYYY-MM-DD string in local timezone
export function getTodayString() {
  return formatLocalDate(new Date())
}

// Get today's date as a Date object (set to midnight local time)
export function getTodayLocal() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// Create a date object from YYYY-MM-DD string (set to midnight local time)
export function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Check if two date strings represent the same day
export function isSameDay(dateString1, dateString2) {
  return dateString1 === dateString2
}

// Check if a date string is today
export function isToday(dateString) {
  return dateString === getTodayString()
}

// Format date string for display (local timezone aware)
export function formatDateForDisplay(dateString) {
  const date = parseLocalDate(dateString)
  return date.toLocaleDateString()
}

// Get date string for N days ago (in local timezone)
export function getDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatLocalDate(date)
}

// Get date string for N days from now (in local timezone)
export function getDaysFromNow(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}
