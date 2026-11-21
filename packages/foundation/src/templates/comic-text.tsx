"use client"

import { type CSSProperties } from "react"
import { motion } from "motion/react"

import { cn } from "./lib/utils.js"

type ComicTextProps = {
  children: string
  className?: string
  style?: CSSProperties
  fontSize?: number
}

export function ComicText({
  children,
  className,
  style,
  fontSize = 5,
}: ComicTextProps) {
  if (typeof children !== "string") {
    throw new Error("children must be a string")
  }

  const dotColor = "var(--destructive)"
  const backgroundColor = "var(--brand)"

  return (
    <motion.div
      className={cn("text-center select-none", className)}
      style={{
        fontSize: `${fontSize}rem`,
        fontFamily: "'Bangers', 'Comic Sans MS', 'Impact', sans-serif",
        fontWeight: "900",
        WebkitTextStroke: `${fontSize * 0.35}px black`,
        transform: "skewX(-10deg)",
        textTransform: "uppercase",
        filter: `
          drop-shadow(0.3125rem 0.3125rem 0rem black) 
          drop-shadow(0.1875rem 0.1875rem 0rem ${dotColor})
        `,
        backgroundColor: backgroundColor,
        backgroundImage: `radial-gradient(circle at 0.0625rem 0.0625rem, ${dotColor} 0.0625rem, transparent 0)`,
        backgroundSize: "0.5rem 0.5rem",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        ...style,
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275],
        type: "spring",
      }}
    >
      {children}
    </motion.div>
  )
}
