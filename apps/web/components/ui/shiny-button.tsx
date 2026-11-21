/** GENERATED from the Default identity (fixtures/identity.default.json).
 * Do not hand-edit — re-run: pnpm --filter web sync-components */
"use client"

import React from "react"
import { motion, type MotionProps } from "motion/react"

import { cn } from "@/lib/utils"

const animationProps: MotionProps = {
  initial: { "--x": "100%", scale: 0.8 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
}

interface ShinyButtonProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>,
    MotionProps {
  children: React.ReactNode
  className?: string
}

export const ShinyButton = React.forwardRef<
  HTMLButtonElement,
  ShinyButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative cursor-pointer rounded-lg border-(length:--border-width) px-6 py-2 font-medium backdrop-blur-xl transition-shadow duration-(--motion-normal-duration) ease-in-out hover:shadow-sm dark:bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_10%,transparent)_0%,transparent_60%)] dark:hover:shadow-lg",
        className
      )}
      {...animationProps}
      {...props}
    >
      <span
        className="relative block size-full text-sm tracking-wide text-foreground/65 uppercase dark:font-light"
        style={{
          maskImage:
            "linear-gradient(-75deg,var(--primary) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),var(--primary) calc(var(--x) + 100%))",
        }}
      >
        {children}
      </span>
      <span
        style={{
          mask: "linear-gradient(var(--foreground), var(--foreground)) content-box exclude,linear-gradient(var(--foreground), var(--foreground))",
          WebkitMask:
            "linear-gradient(var(--foreground), var(--foreground)) content-box exclude,linear-gradient(var(--foreground), var(--foreground))",
          backgroundImage:
            "linear-gradient(-75deg,color-mix(in oklab, var(--primary) 10%, transparent) calc(var(--x)+20%),color-mix(in oklab, var(--primary) 50%, transparent) calc(var(--x)+25%),color-mix(in oklab, var(--primary) 10%, transparent) calc(var(--x)+100%))",
        }}
        className="absolute inset-0 z-10 block rounded-[inherit] p-px"
      />
    </motion.button>
  )
})

ShinyButton.displayName = "ShinyButton"
