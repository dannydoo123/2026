import { useState, useEffect } from 'react'
import './AnimatedSprite.css'

function AnimatedSprite({ character, delay = 0, side = 'left' }) {
  // Cage boundaries - ADJUST THESE NUMBERS to change the restricted area
  const getCageBoundaries = () => {
    const characterSize = 120

    // Horizontal boundaries (X axis)
    let minX, maxX
    if (side === 'left') {
      minX = 0
      maxX = window.innerWidth / 3.2 - characterSize
    } else {
      minX = (window.innerWidth * 2) / 2.8
      maxX = window.innerWidth - characterSize
    }

    // Vertical boundaries (Y axis) - bottom half of screen
    const minY = window.innerHeight / 2
    const maxY = window.innerHeight - characterSize

    return { minX, maxX, minY, maxY }
  }

  const getInitialPosition = () => {
    const { minX, maxX, minY, maxY } = getCageBoundaries()
    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    }
  }

  const [position, setPosition] = useState(getInitialPosition())
  const [direction, setDirection] = useState({
    x: (Math.random() - 0.5) * 2.4,  // Horizontal: faster (1 minute to cross cage)
    y: (Math.random() - 0.5) * 1.2   // Vertical: slower (2 minutes to cross)
  })

  useEffect(() => {
    // Wait for delay before starting movement
    const startTimeout = setTimeout(() => {
      const moveInterval = setInterval(() => {
        setPosition(prev => {
          const { minX, maxX, minY, maxY } = getCageBoundaries()

          let newX = prev.x + direction.x
          let newY = prev.y + direction.y

          // Bounce off horizontal cage boundaries
          if (newX < minX || newX > maxX) {
            setDirection(d => ({ ...d, x: -d.x }))
            newX = Math.max(minX, Math.min(maxX, newX))
          }

          // Bounce off vertical cage boundaries
          if (newY < minY || newY > maxY) {
            setDirection(d => ({ ...d, y: -d.y }))
            newY = Math.max(minY, Math.min(maxY, newY))
          }

          return { x: newX, y: newY }
        })
      }, 50)

      // Change direction randomly every 3-7 seconds
      const directionInterval = setInterval(() => {
        setDirection({
          x: (Math.random() - 0.5) * 2.4,  // Horizontal: faster
          y: (Math.random() - 0.5) * 1.2   // Vertical: slower
        })
      }, 3000 + Math.random() * 4000)

      return () => {
        clearInterval(moveInterval)
        clearInterval(directionInterval)
      }
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [delay, side])

  return (
    <div
      className="animated-sprite"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundImage: `url(/characters_spritesheet/${character}.png)`
      }}
    />
  )
}

export default AnimatedSprite
