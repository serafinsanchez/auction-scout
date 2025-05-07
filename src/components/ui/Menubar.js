import * as React from "react"
import { cn } from "./utils"

export function Menubar({ className, ...props }) {
  return (
    <nav className={cn("flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700", className)} {...props} />
  )
}

export function MenubarMenu({ className, ...props }) {
  return <div className={cn("relative", className)} {...props} />
}

export function MenubarTrigger({ className, ...props }) {
  return (
    <button className={cn("px-3 py-1 rounded-md font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors", className)} {...props} />
  )
}

export function MenubarContent({ className, ...props }) {
  return (
    <div className={cn("absolute left-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 z-10", className)} {...props} />
  )
}

export function MenubarItem({ className, ...props }) {
  return (
    <div className={cn("px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded transition-colors", className)} {...props} />
  )
} 