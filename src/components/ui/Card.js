import * as React from "react"
import { cn } from "./utils"

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden", className)} {...props} />
))
Card.displayName = "Card"

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
CardContent.displayName = "CardContent" 