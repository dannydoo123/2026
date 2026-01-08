import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if viewport is mobile-sized
 * @param {number} breakpoint - Width in pixels to consider as mobile (default: 768)
 * @returns {boolean} - True if viewport width is <= breakpoint
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint)
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Call handler right away so state gets updated with initial window size
    handleResize()

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}

/**
 * Get the current breakpoint tier
 * @returns {string} - 'mobile' | 'tablet' | 'desktop'
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window === 'undefined') return 'desktop'
    const width = window.innerWidth
    if (width <= 480) return 'mobile'
    if (width <= 1024) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width <= 480) setBreakpoint('mobile')
      else if (width <= 1024) setBreakpoint('tablet')
      else setBreakpoint('desktop')
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}
