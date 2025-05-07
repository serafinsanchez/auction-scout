import * as React from "react"
import { cn } from "./utils"

export function Table({ className, ...props }) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900", className)}>
      <table className="w-full text-sm text-left text-slate-700 dark:text-slate-200" {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm", className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("divide-y divide-slate-200 dark:divide-slate-700", className)} {...props} />
}

export function TableRow({ className, onClick, ...props }) {
  return <tr onClick={onClick} className={cn("hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer hover:scale-[1.01]", className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-6 py-4", className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return <th className={cn("px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none", className)} {...props} />
}

export function TableFooter({ className, ...props }) {
  return <tfoot className={cn("bg-slate-100 dark:bg-slate-800", className)} {...props} />
} 