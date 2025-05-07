import * as React from "react"
import { cn } from "./utils"

export function Heading({ level = 1, className, ...props }) {
  const Tag = `h${level}`
  return (
    <Tag
      className={cn(
        "font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100",
        level === 1 && "text-3xl md:text-4xl lg:text-5xl",
        level === 2 && "text-2xl md:text-3xl lg:text-4xl",
        level === 3 && "text-xl md:text-2xl lg:text-3xl",
        level === 4 && "text-lg md:text-xl lg:text-2xl",
        className
      )}
      {...props}
    />
  )
}

export function Paragraph({ className, ...props }) {
  return (
    <p className={cn("text-base leading-relaxed text-slate-700 dark:text-slate-300", className)} {...props} />
  )
}

export function Text({ className, ...props }) {
  return (
    <span className={cn("text-base text-slate-700 dark:text-slate-300", className)} {...props} />
  )
} 