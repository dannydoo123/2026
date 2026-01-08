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

// Create a date object from YYYY-MM-DD string
export function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
