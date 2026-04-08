"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface HolographicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function HolographicCard({ children, className, ...props }: HolographicCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 12
    const rotateY = (centerX - x) / 12

    card.style.setProperty("--holo-x", `${x}px`)
    card.style.setProperty("--holo-y", `${y}px`)
    card.style.setProperty("--holo-bg-x", `${(x / rect.width) * 100}%`)
    card.style.setProperty("--holo-bg-y", `${(y / rect.height) * 100}%`)
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)"
    card.style.setProperty("--holo-x", "50%")
    card.style.setProperty("--holo-y", "50%")
    card.style.setProperty("--holo-bg-x", "50%")
    card.style.setProperty("--holo-bg-y", "50%")
  }

  return (
    <div
      ref={cardRef}
      className={cn("holographic-card", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      <div className="holo-glow" aria-hidden="true" />
    </div>
  )
}
