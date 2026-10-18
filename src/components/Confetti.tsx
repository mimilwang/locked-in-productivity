import { useEffect, useState } from 'react'
import './Confetti.css'

// Pieces are generated once so they look the same every time.
const PIECES = Array.from({ length: 70 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: ((i * 13) % 20) / 20,
  duration: 2.2 + ((i * 7) % 10) / 10,
  color: ['#1b3a73', '#c3b1e1', '#ffd66b', '#ff9778', '#8ec5e8', '#fff9ef'][i % 6],
  rotate: (i * 47) % 360,
}))

/** A one-time confetti burst. Shows while `active` is true, then hides itself after ~4 seconds. */
export default function Confetti({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (!active) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 4200)
    return () => clearTimeout(timer)
  }, [active])

  if (!visible) return null
  return (
    <div className="confetti" aria-hidden>
      {PIECES.map((piece, i) => (
        <span
          key={i}
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
